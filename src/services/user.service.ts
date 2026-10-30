import { currentUser } from "@/data/users";
import { UserProfile } from "@/data/types";

export async function getCurrentUser(): Promise<UserProfile> {
  return currentUser;
}
