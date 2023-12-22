export interface ProfileData {
  username: string;
  image?: string;
  following?: boolean;
}

export interface ProfileRO {
  profile: ProfileData;
}
