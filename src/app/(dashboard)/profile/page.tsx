import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileBasicForm } from "./profile-basic-form";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { ProjectsSection } from "./projects-section";
import { CertificationsSection } from "./certifications-section";
import {
  getCareerProfile,
  getWorkExperiences,
  getEducation,
  getSkills,
  getProjects,
  getCertifications,
} from "./actions";

export default async function ProfilePage() {
  const [profile, experiences, educationList, skillsList, projectsList, certsList] =
    await Promise.all([
      getCareerProfile(),
      getWorkExperiences(),
      getEducation(),
      getSkills(),
      getProjects(),
      getCertifications(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--on-surface-muted)]">
          Source of truth
        </p>
        <h1 className="font-headline mt-1.5 text-[clamp(32px,4vw,44px)] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--on-surface)]">
          Career <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">profile</em>
        </h1>
        <p className="mt-2 text-[var(--on-surface-muted)]">
          Build it once; remix it for every role. Every resume draws from here.
        </p>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="experience">
            Experience ({experiences.length})
          </TabsTrigger>
          <TabsTrigger value="education">
            Education ({educationList.length})
          </TabsTrigger>
          <TabsTrigger value="skills">Skills ({skillsList.length})</TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({projectsList.length})
          </TabsTrigger>
          <TabsTrigger value="certifications">
            Certs ({certsList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <ProfileBasicForm profile={profile} />
        </TabsContent>

        <TabsContent value="experience">
          <ExperienceSection experiences={experiences} />
        </TabsContent>

        <TabsContent value="education">
          <EducationSection education={educationList} />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsSection skills={skillsList} />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectsSection projects={projectsList} />
        </TabsContent>

        <TabsContent value="certifications">
          <CertificationsSection certifications={certsList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
