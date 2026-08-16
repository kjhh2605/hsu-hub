package site.hsu.hub;
import com.tngtech.archunit.core.importer.ClassFileImporter;import com.tngtech.archunit.core.importer.ImportOption;import org.junit.jupiter.api.Test;import org.springframework.modulith.core.ApplicationModules;import org.springframework.web.bind.annotation.RestController;import java.util.Arrays;import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;import static org.assertj.core.api.Assertions.assertThat;
class ArchitectureTest{
 @Test void modulithBoundariesAreValid(){ApplicationModules.of(HsuHubApplication.class).verify();}
 @Test void domainDoesNotDependOnApplicationOrAdapters(){var classes=new ClassFileImporter().withImportOption(new ImportOption.DoNotIncludeTests()).importPackages("site.hsu.hub");noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAnyPackage("..application..","..adapter..").check(classes);}
 @Test void everyRestControllerImplementsMatchingDocsInterface(){var classes=new ClassFileImporter().importPackages("site.hsu.hub");classes.stream().filter(c->c.isAnnotatedWith(RestController.class)).forEach(controller->assertThat(Arrays.stream(controller.reflect().getInterfaces()).map(Class::getSimpleName)).as(controller.getName()).contains(controller.getSimpleName()+"Docs"));}
}
