import "@babel/polyfill";
import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: `http://localhost:8080/api/v1/users/login`,
      data: {
        email,
        password,
      },
    });
    if (res.data.status === "Success") {
      showAlert("success", "logged in succesfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1000);
    }
  } catch (error) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = axios({
      method: "GET",
      url: `http://localhost:8080/api/v1/users/logout`,
    });
    if (res.data.status === "Success") location.reload(ture);
  } catch (error) {
    showAlert("error", `Error while logging out`);
  }
};
