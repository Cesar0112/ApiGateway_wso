import { IPermissionCasdoor } from "../../../permissions/providers/casdoor/permission.casdoor.interface";
import { IRoleCasdoor } from "../../../roles/providers/casdoor/role.casdoor.interface";

export interface FaceId {
    ImageUrl: string;
    faceIdData: number[];
    name: string;
}
export interface ManagedAccount {
    application: string;
    password: string;
    signinUrl: string;
    username: string;
}
export interface MfaAccount {
    accountName: string;
    issuer: string;
    origin: string;
    secretKey: string;
}
export interface MfaItem {
    name: string;
    rule: string;
}
export interface MfaProps {
    countryCode: string;
    enabled: boolean;
    isPreferred: boolean;
    mfaRememberInHours: number;
    mfaType: string;
    recoveryCodes: string[];
    secret: string;
    url: string;
}

export interface ICasdoorUser {
    accessKey: string;
    accessSecret: string;
    accessToken: string;
    address: string[];
    adfs: string;
    affiliation: string;
    alipay: string;
    amazon: string;
    apple: string;
    auth0: string;
    avatar: string;
    avatarType: string;
    azuread: string;
    azureadb2c: string;
    baidu: string;
    balance: number;
    battlenet: string;
    bilibili: string;
    bio: string;
    birthday: string;
    bitbucket: string;
    box: string;
    casdoor: string;
    cloudfoundry: string;
    countryCode: string;
    createdIp: string;
    createdTime: string;
    currency: string;
    custom: string;
    dailymotion: string;
    deezer: string;
    deletedTime: string;
    digitalocean: string;
    dingtalk: string;
    discord: string;
    displayName: string;
    douyin: string;
    dropbox: string;
    education: string;
    email: string;
    emailVerified: boolean;
    eveonline: string;
    externalId: string;
    faceIds: FaceId[];
    facebook: string;
    firstName: string;
    fitbit: string;
    gender: string;
    gitea: string;
    gitee: string;
    github: string;
    gitlab: string;
    google: string;
    groups: string[];
    hash: string;
    heroku: string;
    homepage: string;
    id: string;
    idCard: string;
    idCardType: string;
    influxcloud: string;
    infoflow: string;
    instagram: string;
    intercom: string;
    invitation: string;
    invitationCode: string;
    ipWhitelist: string;
    isAdmin: boolean;
    isDefaultAvatar: boolean;
    isDeleted: boolean;
    isForbidden: boolean;
    isOnline: boolean;
    kakao: string;
    karma: number;
    kwai: string;
    language: string;
    lark: string;
    lastChangePasswordTime: string;
    lastName: string;
    lastSigninIp: string;
    lastSigninTime: string;
    lastSigninWrongTime: string;
    lastfm: string;
    ldap: string;
    line: string;
    linkedin: string;
    location: string;
    mailru: string;
    managedAccounts: ManagedAccount[];
    meetup: string;
    metamask: string;
    mfaAccounts: MfaAccount[];
    mfaEmailEnabled: boolean;
    mfaItems: MfaItem[];
    mfaPhoneEnabled: boolean;
    mfaRememberDeadline: string;
    microsoftonline: string;
    multiFactorAuths: MfaProps[];
    name: string;
    naver: string;
    needUpdatePassword: boolean;
    nextcloud: string;
    okta: string;
    onedrive: string;
    oura: string;
    owner: string;
    password: string;
    passwordSalt: string;
    passwordType: string;
    patreon: string;
    paypal: string;
    permanentAvatar: string;
    permissions: IPermissionCasdoor[];
    phone: string;
    preHash: string;
    preferredMfaType: string;
    properties: { [key: string]: string };
    qq: string;
    ranking: number;
    recoveryCodes: string[];
    region: string;
    roles: IRoleCasdoor[];
    salesforce: string;
    score: number;
    shopify: string;
    signinWrongTimes: number;
    signupApplication: string;
    slack: string;
    soundcloud: string;
    spotify: string;
    steam: string;
    strava: string;
    stripe: string;
    tag: string;
    tiktok: string;
    title: string;
    totpSecret: string;
    tumblr: string;
    twitch: string;
    twitter: string;
    type: string;
    typetalk: string;
    uber: string;
    updatedTime: string;
    vk: string;
    web3onboard: string;
    webauthnCredentials: {}[];
    wechat: string;
    wecom: string;
    weibo: string;
    wepay: string;
    xero: string;
    yahoo: string;
    yammer: string;
    yandex: string;
    zoom: string;
}

// src/common/interfaces/casdoor-response.interface.ts
export interface CasdoorResponse<T = any> {
    status: 'ok' | 'error';
    msg: string;
    data: T;
    data2?: any;  // ← opcional, ignorable
    data3?: any;  // ← opcional, ignorable
    sub?: string;
    name?: string;
}