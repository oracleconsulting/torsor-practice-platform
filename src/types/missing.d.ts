// Temporary type declarations for missing components
declare const CommandCenterPage: React.FC<any>;
declare function renderPage(page: string): React.ReactNode;

// Add missing table types
declare module '@/lib/database.types' {
  interface Database {
    public: {
      Tables: {
        user_profiles: any;
        onboarding_progress: any;
        dashboard_metrics: any;
        tasks: any;
        board_members: any;
        [key: string]: any;
      }
    }
  }
} 