import TransportApi from "./pub_transport/TransportApi.js";
import fs from "fs";
import url from "url";
import path from "path";
import { T_DAYS_MS, T_MINUTES_MS, T_SECONDS_MS } from "../lib/mareda-util/mareda-util/time/time_const.js";
import SerialPortWrapper from "./SerialPortWrapper.js";

const moduledir = path.dirname(url.fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.resolve(moduledir, "../config/apiKeys.json"), "utf-8"));
const cachedir = path.resolve(moduledir, "../cache/");
const stopscache = path.resolve(cachedir, "stops.json");

const SYNC_BYTE = 0b01010101;

(async () => {
    const api = new TransportApi(config.golemio);
    /** @type {mhd.Station[]} **/
    let stations = [];
    try {
        const finf = await fs.promises.stat(stopscache);
        if(Date.now() - finf.mtimeMs < T_DAYS_MS) {
            stations = JSON.parse(await fs.promises.readFile(stopscache, "utf-8"));
        }
    }
    catch(e) {
        console.error(e);
        console.log("Failed to read cached stops, reloading.");
    }
    if(stations.length == 0) {
        stations = await api.getStations();
        await fs.promises.writeFile(stopscache, JSON.stringify(stations));
    }
    const stopName = "strazni";
    let cisId = -1;

    for(const station of stations) {
        const normName = station.fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if(normName == stopName) {
            console.log("Target station ",station.fullName," ID = ", station.cis);
            cisId = station.cis;
            break;
        }
    }
    const port = new SerialPortWrapper({baudRate: 9600, path: "COM6"});


    async function getMoreDepartures() {
        const departures = await api.getDepartures({
            cisIds: cisId,
            limit: 6,
            total: 6,
            minutesAfter: 60,
            minutesBefore: 2,
            filter:"routeHeadingOnce",
            skip: "canceled",
            order: "real",
            preferredTimezone: "Europe_Prague"
        });
        return departures;
    }
    // get departures
    const departures = await getMoreDepartures();
    console.log(departures.departures);
    const usableDepartures = departures.departures.filter(x=>x.stop.platform_code != "B");

    try {
        
        await port.open();
        console.log("Port open: ", port.port.isOpen);
        console.log("Waiting for first sync byte.");
        const firstByte = await port.readByte();
        console.log("Got byte: ", firstByte, " expected? ", firstByte == SYNC_BYTE);
        console.log("Reading as much as possible to clean the buffer");
        while(port.hasDataNow()) {
            console.log(await port.readByte());
        }
        while(usableDepartures.length > 0) {
            const dep = usableDepartures[0];
            await port.writeByte(0b01010101);
            const depTime = new Date(dep.departure_timestamp.predicted);
            const connName = dep.route.short_name;
            const depMinutes = Math.max(0, Math.floor((depTime.getTime()-Date.now())/T_MINUTES_MS));
            console.log("Send connection: ", connName, " to ", dep.trip.headsign, "in", depMinutes);
            await port.write(Buffer.from([parseInt(connName), depMinutes]));
            await port.flush();


            const nowTime = Date.now();
            while(usableDepartures.length > 0) {
                const curTop = usableDepartures[0];
                if(new Date(curTop.departure_timestamp.predicted).getTime() - nowTime < -1*T_SECONDS_MS*10) {
                    console.log("Removing outdated departure: ", usableDepartures[0]);
                    usableDepartures.shift();
                }
                else {
                    break;
                }
            }
            if(usableDepartures.length == 0) {
                const moreDepartures = await getMoreDepartures();
                console.log("Loaded more departures ", moreDepartures.departures.length);
                usableDepartures.push(...moreDepartures.departures.filter(x=>x.stop.platform_code != "B"));
            }
            console.log("Waiting for sync byte.");
            const syncExpected = await port.readByte();
            console.log("Got byte: ", syncExpected, " expected? ", syncExpected == SYNC_BYTE)
        }

        await port.close();
    }
    catch(e) {
        const list = await SerialPortWrapper.list();
        for(const x of list) {
            console.log(x.path);
        }
        throw e;
    }
})();