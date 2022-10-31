import axios from "axios";
import { toast } from "react-toastify";
import mainConfig from "../config.json";
import { httpAuth } from "../hooks/useAuth";
import localStorageService from "./localStorage.service";

const http = axios.create({
    baseURL: mainConfig.apiEndpoint
});

http.interceptors.request.use(async (config) => {
    // If database is Firebase
    if (mainConfig.isFirebase) {
        // Add json to request
        (config.url = (config.url[config.url.length - 1] === "/"
            ? config.url.slice(0, -1)
            : config.url) + ".json");

        // Request to update access token if needed
        const refreshToken = localStorageService.getRefreshToken();
        const expireToken = localStorageService.getTokenExpiresDate();

        if (refreshToken && expireToken < +new Date()) {
            const { data } = await httpAuth.post(mainConfig.firebaseUpdateTokenEndpoint + process.env.REACT_APP_FIREBASE_KEY, {
                grant_type: "refresh_token",
                refresh_token: refreshToken
            });

            localStorageService.setTokens({
                refreshToken: data.refresh_token,
                idToken: data.id_token,
                localId: data.user_id,
                experesIn: data.expires_in
            });
        }

        // Add access token to request if exists
        const accessToken = localStorageService.getAccessToken();
        accessToken && (config.params = { ...config.params, auth: accessToken });
    }

    return config;
}, (error) => Promise.reject(error));

const objsToObjArr = (data) => data && !data?._id
    ? Object.values(data).map((dt) => ({ ...dt }))
    : data;

http.interceptors.response.use(
    (res) => {
        mainConfig.isFirebase && (res.data = { content: objsToObjArr(res.data) });
        return res;
    }, (error) => {
        // Check if errors occupied
        const status = error?.response?.status;
        const isExpected = status && status >= 400 && status < 500;
        !isExpected && console.log(error.response);
        toast.error("This is an error!");
        return Promise.reject(error);
    }
);

const httpService = {
    get: http.get,
    post: http.post,
    put: http.put,
    delete: http.delete
};

export default httpService;
