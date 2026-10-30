import { UserProfile } from "./types";
import { images } from "./images";

export const currentUser: UserProfile = {
  id: "user-1",
  firstName: "Layla",
  lastName: "Hassan",
  email: "layla.hassan@example.com",
  phone: "+20 100 123 4567",
  country: "Egypt",
  language: "en",
  currency: "EGP",
  avatar: images.avatar(44),
};
