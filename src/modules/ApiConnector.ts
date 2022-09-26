import axios, { AxiosRequestConfig } from "axios";
import { TokenManager } from "./TokenManager";
const config = require("../../config.json5");
const querystring = require('querystring');


export class ApiConnector {
    private TokenManager: TokenManager;
    constructor() {
        this.TokenManager = new TokenManager();
    }

    private async getConfig() {
        return {
            headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            Authorization: "Bearer " + await this.TokenManager.getToken()
            }
        }
    }

    /**
     * @param {string} url
     * @return {*} 
     * @memberof ApiConnector
     */
    public async get(url: string) {
        const config = await this.getConfig();
        return axios.get(url, config);
    }

    /**
     *
     * @param {string} url
     * @param {*} data
     * @return {*} 
     * @memberof ApiConnector
     */
    public async post(url: string, data: any) {
        const config = await this.getConfig();
        return axios.post(url, data, config);
    }
  
}