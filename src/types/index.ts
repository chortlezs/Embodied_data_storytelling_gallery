export interface Case {
  title: string;
  venue: string;
  link: string;
  year: number | null;
  illustration: string;
  tags: {
    [mainCategory: string]: {
      [subGroup: string]: string[];
    };
  };
}

export interface Taxonomy {
  [mainCategory: string]: {
    [subGroup: string]: string[];
  };
}

export interface CaseData {
  cases: Case[];
  taxonomy: Taxonomy;
}
