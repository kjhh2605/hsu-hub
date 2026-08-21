package site.hsu.hub.club.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import site.hsu.hub.club.adapter.out.persistence.*;
import site.hsu.hub.club.api.*;
import site.hsu.hub.club.domain.ClubRecruitmentStatus;
import site.hsu.hub.club.domain.ClubRole;
import site.hsu.hub.common.exception.*;
import site.hsu.hub.file.api.*;
import site.hsu.hub.identity.api.CurrentUser;

import java.time.Instant;
import java.util.*;

@Service
public class ClubService implements ClubScope {
    private static final int INTRODUCTION_IMAGE_LIMIT = 10;
    private final ClubRepository clubs;
    private final ClubUserRepository mappings;
    private final ClubIntroductionImageRepository introductionImages;
    private final CurrentUser current;
    private final FileStorageService files;
    private final ClubRecruitmentSummaryReader recruitments;
    private final ClubApplicationStatusReader applications;

    public ClubService(ClubRepository clubs, ClubUserRepository mappings,
                       ClubIntroductionImageRepository introductionImages, CurrentUser current,
                       FileStorageService files, ClubRecruitmentSummaryReader recruitments,
                       ClubApplicationStatusReader applications) {
        this.clubs = clubs;
        this.mappings = mappings;
        this.introductionImages = introductionImages;
        this.current = current;
        this.files = files;
        this.recruitments = recruitments;
        this.applications = applications;
    }

    @Transactional(readOnly = true)
    public List<ClubView> list() {
        var found = clubs.findAll();
        var summaries = recruitments.currentForClubs(found.stream().map(ClubEntity::id).toList(), Instant.now());
        Long userId = current.id();
        return found.stream().map(c -> view(c, summaries.get(c.id()), userId)).toList();
    }

    @Transactional(readOnly = true)
    public ClubView get(Long id) {
        var c = find(id);
        var summary = recruitments.currentForClubs(List.of(id), Instant.now()).get(id);
        return view(c, summary, current.id());
    }

    @Transactional(readOnly = true)
    public List<ClubView> operatorClubs() {
        var u = current.require();
        if (u.serviceAdmin()) return list();
        var ids = mappings.findByUserIdAndRole(u.id(), ClubRole.OPERATOR).stream().map(ClubUserEntity::clubId).toList();
        var summaries = recruitments.currentForClubs(ids, Instant.now());
        return clubs.findAllById(ids).stream().map(c -> view(c, summaries.get(c.id()), u.id())).toList();
    }

    @Transactional(readOnly = true)
    public ClubView operatorGet(Long id) { requireOperator(id); return get(id); }

    @Transactional
    public ClubView update(Long id, UpdateClub command) {
        requireOperator(id);
        var c = find(id);
        var existing = introductionImages.findByClubIdOrderByDisplayOrder(id);
        var requestedIds = command.introductionImageIds() == null
                ? existing.stream().map(ClubIntroductionImageEntity::id).toList()
                : List.copyOf(command.introductionImageIds());
        validateImageIds(id, requestedIds);
        if (requestedIds.size() > INTRODUCTION_IMAGE_LIMIT)
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "소개 이미지는 최대 10장까지 등록할 수 있습니다.");
        var removedFileIds = existing.stream().filter(image -> !requestedIds.contains(image.id()))
                .map(ClubIntroductionImageEntity::fileAssetId).toList();
        if (!existing.isEmpty()) {
            introductionImages.deleteAll(existing);
            introductionImages.flush();
        }
        int order = 0;
        for (Long imageId : requestedIds) {
            var original = existing.stream().filter(image -> image.id().equals(imageId)).findFirst()
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
            introductionImages.save(new ClubIntroductionImageEntity(id, original.fileAssetId(), order++));
        }
        c.update(command.shortIntroduction(), command.detailedIntroduction(),
                command.recruitmentStatus() == null ? c.recruitmentStatus() : command.recruitmentStatus());
        if (!removedFileIds.isEmpty()) registerFileCleanup(removedFileIds);
        return view(c, null, current.id());
    }

    @Transactional
    public ClubView uploadIntroductionImages(Long id, List<UploadedImage> uploads) {
        requireOperator(id);
        var c = find(id);
        var existing = introductionImages.findByClubIdOrderByDisplayOrder(id);
        if (uploads == null || uploads.isEmpty()) throw new ApiException(ErrorCode.VALIDATION_FAILED, "소개 이미지를 선택해 주세요.");
        if (existing.size() + uploads.size() > INTRODUCTION_IMAGE_LIMIT)
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "소개 이미지는 최대 10장까지 등록할 수 있습니다.");
        var stored = new ArrayList<StoredFile>();
        try {
            for (var upload : uploads) stored.add(files.storeIntroductionImage(upload.filename(), upload.contentType(), upload.bytes()));
            int order = existing.size();
            for (var file : stored) introductionImages.save(new ClubIntroductionImageEntity(id, file.id(), order++));
            return view(c, null, current.id());
        } catch (RuntimeException error) {
            stored.forEach(file -> { try { files.delete(file.id()); } catch (RuntimeException ignored) {} });
            throw error;
        }
    }

    @Transactional
    public ClubView replaceCover(Long id, String filename, String type, byte[] bytes) {
        requireOperator(id);
        var stored = files.storeCover(filename, type, bytes);
        var c = find(id);
        Long old = c.replaceCover(stored.id());
        if (old != null) registerFileCleanup(List.of(old));
        return view(c, null, current.id());
    }

    @Transactional(readOnly = true)
    public StoredFile cover(Long id) {
        var c = find(id);
        if (c.coverFileAssetId() == null) throw new ApiException(ErrorCode.NOT_FOUND);
        return files.read(c.coverFileAssetId());
    }

    @Transactional(readOnly = true)
    public StoredFile introductionImage(Long clubId, Long imageId) {
        find(clubId);
        var image = introductionImages.findById(imageId)
                .filter(item -> item.clubId().equals(clubId))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        return files.read(image.fileAssetId());
    }

    @Override
    public void requireOperator(Long clubId) {
        var u = current.require();
        if (!u.serviceAdmin() && !mappings.existsByUserIdAndClubIdAndRole(u.id(), clubId, ClubRole.OPERATOR))
            throw new ApiException(ErrorCode.NOT_FOUND);
    }

    @Override
    @Transactional
    public void lockOperatorClub(Long id) {
        requireOperator(id);
        clubs.findByIdForUpdate(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRecruiting(Long clubId) {
        return find(clubId).recruitmentStatus() == ClubRecruitmentStatus.RECRUITING;
    }

    @Override
    public boolean canOperate(Long userId, Long id) {
        var u = current.require();
        return u.id().equals(userId) && (u.serviceAdmin() || mappings.existsByUserIdAndClubIdAndRole(userId, id, ClubRole.OPERATOR));
    }

    private void validateImageIds(Long clubId, List<Long> ids) {
        if (ids.stream().anyMatch(Objects::isNull) || ids.size() != new HashSet<>(ids).size())
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "소개 이미지 순서를 확인해 주세요.");
        var existingIds = new HashSet<>(introductionImages.findByClubIdOrderByDisplayOrder(clubId).stream().map(ClubIntroductionImageEntity::id).toList());
        if (!existingIds.containsAll(ids)) throw new ApiException(ErrorCode.NOT_FOUND);
    }

    private void registerFileCleanup(List<Long> fileIds) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            fileIds.forEach(files::delete);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { fileIds.forEach(fileId -> { try { files.delete(fileId); } catch (RuntimeException ignored) {} }); }
        });
    }

    private ClubEntity find(Long id) { return clubs.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)); }

    private ClubView view(ClubEntity c, ClubRecruitmentSummaryReader.Summary summary, Long userId) {
        RecruitmentView recruitment = summary == null ? null : new RecruitmentView(summary.recruitmentId(), summary.state(), summary.opensAt(), summary.closesAt(), applications.hasApplied(userId, summary.recruitmentId()));
        var images = introductionImages.findByClubIdOrderByDisplayOrder(c.id()).stream().map(image -> new IntroductionImageView(image.id())).toList();
        return new ClubView(c.id(), c.name(), c.category(), c.shortIntroduction(), c.detailedIntroduction(), c.recruitmentStatus(), c.coverFileAssetId() != null, images, recruitment);
    }

    public record UpdateClub(String shortIntroduction, String detailedIntroduction, ClubRecruitmentStatus recruitmentStatus, List<Long> introductionImageIds) {}
    public record UploadedImage(String filename, String contentType, byte[] bytes) {}
    public record IntroductionImageView(Long id) {}
    public record RecruitmentView(Long recruitmentId, String state, Instant opensAt, Instant closesAt, boolean alreadyApplied) {}
    public record ClubView(Long id, String name, String category, String shortIntroduction, String detailedIntroduction,
                           ClubRecruitmentStatus recruitmentStatus, boolean hasCover, List<IntroductionImageView> introductionImages,
                           RecruitmentView recruitment) {}
}
