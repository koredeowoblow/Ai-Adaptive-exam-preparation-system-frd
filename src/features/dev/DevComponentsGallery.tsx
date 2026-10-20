import * as React from 'react';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { PageHeader } from '../../shared/components/PageHeader';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { Card } from '../../shared/components/Card';
import { EmptyState } from '../../shared/components/EmptyState';
import { Skeleton } from '../../shared/components/Skeleton';
import { Stepper } from '../../shared/components/Stepper';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { Dialog, DialogFooter } from '../../shared/components/Dialog';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { Dropdown } from '../../shared/components/Dropdown';
import { ThemeToggle } from '../../shared/components/ThemeToggle';
import {
  BookOpen,
  User, MoreVertical, LogOut, Settings
} from 'lucide-react';

export default function DevComponentsGallery() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [progressVal, setProgressVal] = React.useState(45);
  const [inputValue, setInputValue] = React.useState('');
  const [selectValue, setSelectValue] = React.useState('csc401');

  const dropdownItems = [
    {
      id: 'profile',
      label: 'Student Profile',
      icon: <User size={14} />,
      onClick: () => console.log('Profile'),
    },
    {
      id: 'settings',
      label: 'Preferences',
      icon: <Settings size={14} />,
      onClick: () => console.log('Settings'),
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut size={14} />,
      destructive: true,
      divider: true,
      onClick: () => console.log('Logout'),
    },
  ];

  return (
    <PageContainer className="py-8 space-y-12">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-text-primary tracking-tight">
            Component Design System Gallery
          </h1>
          <p className="text-sm text-text-muted mt-1">
            EduAdapt visual design tokens, atomic components, and layout primitives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Badge variant="info">Dev Only</Badge>
        </div>
      </div>

      {/* 1. Page Header */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">1. Page Header</h2>
        <PageHeader
          title="Data Structures & Algorithms"
          description="Prepare with adaptive past questions, timed mock tests, and AI mastery tracks."
          actions={<Button variant="primary">Resume Practice</Button>}
        />
      </section>

      {/* 2. Buttons (4 Disciplined Tiers) */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">2. Buttons (4 Tiers)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Destructive Action</Button>
          <Button variant="primary" isLoading>Saving...</Button>
          <Button variant="secondary" disabled>Disabled State</Button>
        </div>
      </section>

      {/* 3. Badges */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">3. Status Badges</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">Neutral Draft</Badge>
          <Badge variant="info">Info Tier</Badge>
          <Badge variant="success">Mastered (85%)</Badge>
          <Badge variant="warning">Needs Practice</Badge>
          <Badge variant="danger">Weak Concept</Badge>
        </div>
      </section>

      {/* 4. Form Controls (Input & Select) */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">4. Form Inputs & Selects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input
            id="dev-demo-input"
            label="Matric / Student ID"
            placeholder="e.g. 20/52HA089"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Enter your university-assigned identifier."
          />
          <Select
            id="dev-demo-select"
            label="Active Course"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            options={[
              { value: 'csc401', label: 'CSC 401 - Artificial Intelligence' },
              { value: 'csc411', label: 'CSC 411 - Distributed Systems' },
              { value: 'mat201', label: 'MAT 201 - Mathematical Methods' },
            ]}
          />
        </div>
      </section>

      {/* 5. Stepper */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">5. Stepper</h2>
        <Card className="p-6">
          <Stepper
            steps={[
              { id: '1', label: 'Select Level', sublabel: 'Your track' },
              { id: '2', label: 'Choose Course', sublabel: 'Curriculum' },
              { id: '3', label: 'Start Prep', sublabel: 'Timed mock' },
            ]}
            currentStepIndex={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={currentStep >= 2}
              onClick={() => setCurrentStep((prev) => Math.min(2, prev + 1))}
            >
              Next Step
            </Button>
          </div>
        </Card>
      </section>

      {/* 6. Progress Bar */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">6. Progress Indicators</h2>
        <Card className="p-6 space-y-4 max-w-lg">
          <ProgressBar
            progress={progressVal}
            label="Module Mastery"
            showLabel
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setProgressVal(25)}>25%</Button>
            <Button size="sm" variant="outline" onClick={() => setProgressVal(50)}>50%</Button>
            <Button size="sm" variant="outline" onClick={() => setProgressVal(85)}>85%</Button>
          </div>
        </Card>
      </section>

      {/* 7. Dropdown & Dialog */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">7. Overlays (Dropdown & Dialog)</h2>
        <div className="flex items-center gap-4">
          <Dropdown
            trigger={
              <Button variant="outline" className="flex items-center gap-2">
                Actions <MoreVertical size={16} />
              </Button>
            }
            items={dropdownItems}
          />

          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open Accessible Dialog
          </Button>
        </div>

        <Dialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Confirm Practice Session Reset"
          description="Are you sure you want to discard your unsubmitted answers? This will recalibrate question difficulty."
        >
          <div className="py-2 text-sm text-text-muted">
            Your progress up to question 7 will remain saved in local drafts.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Keep Working
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Discard Session
            </Button>
          </DialogFooter>
        </Dialog>
      </section>

      {/* 8. Skeletons */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">8. Skeletons</h2>
        <Card className="p-6 space-y-4 max-w-md">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" width={40} height={40} />
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
          <Skeleton variant="rect" height={90} />
        </Card>
      </section>

      {/* 9. Empty States */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">9. Empty State</h2>
        <Card className="p-6">
          <EmptyState
            icon={<BookOpen size={28} />}
            title="No Past Questions Found"
            description="You have not enrolled in any courses for the 2025/2026 academic session yet."
            action={{
              label: 'Browse Course Catalog',
              onClick: () => console.log('Browse'),
            }}
          />
        </Card>
      </section>
    </PageContainer>
  );
}
