import axios, { AxiosRequestConfig } from "axios";
const config = require("../../config.json5");
const querystring = require('querystring');

export class TokenManager {
  private authConfig: AxiosRequestConfig;
  private auth_url: string;
  private token: string;
  private scope: string;
  private expire_in: number;
  private obtained_time: number;


  constructor() {
    this.token = null
    this.auth_url = config.kone.auth_url;
    this.authConfig = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        Authorization: "Basic "+ Buffer.from(config.kone.client_id + ':' + config.kone.client_secret, 'utf8').toString('base64')
      },
        withCredentials: true
    };
    
  
  }

  public isExpired () {
    const now = new Date().getTime();
    return now - this.obtained_time > this.expire_in;
  }

  // Return token if exist or isn't expired, else create a new one
  public async getToken(): Promise<string> {
    if (this.token && !this.isExpired()) {
      return this.token;
    }
    const response = await axios.post(this.auth_url,
                    querystring.stringify({ grant_type: config.kone.grant_type, scope: config.kone.scope }),
                    this.authConfig);

    this.token = response.data.access_token;
    this.scope = response.data.scope;
    this.expire_in = response.data.expires_in*1000; // convert to ms
    this.obtained_time = new Date().getTime();
    return this.token;
  }
}