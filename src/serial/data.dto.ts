export interface PAYLOAD {
    created_at: Date
    version: String
    version_protocole: String
    sn: String
    total: String
    unit: String
    number_weightings: String
    voucher_number: String
    status: String
    weight_last_stroke: String
    date_last_stroke: String
    time_last_stroke: String
    current_weight_loading: String
}

export interface STATUS {
    delta_time:number
    storage :String
    total_event:number
    total_alert:number
    ip:String
    mac:String
    shutdown_counter:number
    last_log_date:Date | undefined
}