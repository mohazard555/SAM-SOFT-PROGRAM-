
export interface AdminCredentials {
  username: string;
  password?: string;
}

export interface Program {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  downloadUrl: string;
  adUrl: string;
  postAdUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  programs: Program[];
}

export interface Ad {
  id: string;
  name: string;
  description: string;
  link: string;
  image: string;
}

export interface Config {
  siteName: string;
  siteLogo: string;
  developer: string;
  admin: AdminCredentials;
  categories: Category[];
  ads: Ad[];
}
