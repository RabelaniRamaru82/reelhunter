// Types package exports
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          role: 'candidate' | 'recruiter';
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}