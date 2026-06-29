import ListRestaurantClient from "./ListRestaurantClient";
import { CafeProvider } from "@/app/(admin)/context/cafeContext";

export const metadata = {
  title: "List Restaurants - EKMC Admin",
  description: "Manage and filter your restaurants, update statuses, publication states, and manage eatery details.",
};

export default function Page() {
  return (
    <CafeProvider>
      <ListRestaurantClient />
    </CafeProvider>
  );
}
