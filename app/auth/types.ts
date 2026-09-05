export type AuthFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

export const initialAuthFormState: AuthFormState = {
  message: "",
  status: "idle",
};
