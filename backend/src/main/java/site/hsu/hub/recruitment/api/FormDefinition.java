package site.hsu.hub.recruitment.api;

import java.util.List;

public record FormDefinition(Long recruitmentId, List<Step> steps) {
    public FormDefinition { steps = steps == null ? List.of() : List.copyOf(steps); }
    public List<Question> questions() { return steps.stream().flatMap(s -> s.questions().stream()).toList(); }
    public record Step(Long id, String title, int displayOrder, List<Question> questions) {
        public Step { questions = questions == null ? List.of() : List.copyOf(questions); }
    }
    public record Question(Long id, String type, String label, boolean required, String helpText,
                           String placeholder, Integer maxLength, List<String> options) {
        public Question { options = options == null ? List.of() : List.copyOf(options); }
    }
}
