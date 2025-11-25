import { Provider } from "@nestjs/common";
import { AUTH_TYPE_TOKEN } from "../auth.interface";
import { ConfigService } from "../../config/config.service";

export const authTypeValueProvider: Provider = {
    provide: AUTH_TYPE_TOKEN,
    useFactory: (cfg: ConfigService) => {
        const raw = cfg.getConfig?.()?.API_GATEWAY?.AUTH_TYPE ?? process.env.API_GATEWAY_AUTH_TYPE ?? 'wso2';
        return String(raw).toLowerCase();
    },
    inject: [ConfigService],
};