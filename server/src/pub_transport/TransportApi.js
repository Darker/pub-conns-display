class TransportApi {
    /**
     * 
     * @param {string} apiKey 
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.httpRoot = "https://api.golemio.cz/v2/";
    }

    /**
     * 
     * @param {string} url 
     * @param {Object} getargs 
     * @param {Object} postargs 
     */
    async doQuery(url, getargs = {}, postargs = null) {
        const urlQuery = new URL(this.httpRoot);
        urlQuery.pathname = urlQuery.pathname + url;

        for(const [k,v] of Object.entries(getargs)) {
            let val = "";
            if(typeof v == "string") {
                val = v;
            }
            else if(typeof v == "number" || typeof v == "bigint") {
                val = v.toString();
            }
            else if(typeof v == "boolean") {
                val = v ? "true" : "false";
            }
            else {
                throw new TypeError("Cannot put "+k+" in query, typeof v="+(typeof v));
            }
            urlQuery.searchParams.append(k, val);
        }
        console.log("GET "+urlQuery.toString());
        const req = await fetch(urlQuery.toString(), {
            method: "get",
            headers: {
                "accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "X-Access-Token": this.apiKey
            }
        });
        if(req.status != 200) {
            throw new Error("Request failed with status code: "+req.status);
        }
        return await req.json();
    }

    async getStations() {
        const req = await fetch("https://data.pid.cz/stops/json/stops.json");
        if(req.status != 200) {
            throw new Error("Request failed with status code: "+req.status);
        }
        /** @type {mhd.StopsResponse} **/
        const stops = await req.json();
        return stops.stopGroups;
    }

    /**
     * @param {golemio.DepartureBoardQuery} params
     * @returns {Promise<golemio.DepartureBoardResponse>}
     */
    async getDepartures(params) {
        return await this.doQuery("pid/departureboards", params);
    }
};

export default TransportApi;