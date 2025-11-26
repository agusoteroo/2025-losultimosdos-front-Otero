import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import userService from "@/services/user.service";

export const useUser = (userId: string) => {
  const { isLoaded, getToken } = useAuth();

  return useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const data = await userService.getUser(userId, token);
      return data;
    },
    enabled: isLoaded && !!userId, // Only run query when auth is loaded and userId exists
  });
};
