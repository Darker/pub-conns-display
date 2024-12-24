namespace golemio {
    type DepartureMode = "departures" | "arrivals" | "mixed";
    type DepartureSorting = "real" | "timetable";
    type DepartureFiltering = "none" | "routeOnce" | "routeOnceFill" | "routeHeadingOnce" | "routeHeadingOnceFill";
    type DepartureSkip = "canceled" | "atStop" | "untracked";

    interface DepartureBoardQuery {
        cisIds: number;
        minutesBefore?: number;
        minutesAfter?: number;
        includeMetroTrains?: boolean;
        airCondition?: boolean;
        preferredTimezone?: string;
        mode?: DepartureMode = "departures";
        order?: DepartureSorting;
        filter?: DepartureFiltering;
        skip?: string;
        limit?: number;
        total?: number;
        offset?: number;
    }
    interface Stop {
        location_type: number;
        parent_station: string | null;
        platform_code: string;
        stop_id: string;
        stop_lat: number;
        stop_lon: number;
        stop_name: string;
        wheelchair_boarding: number;
        zone_id: string;
        level_id: string | null;
        asw_id: {
            node: number;
            stop: number;
        };
    }

    interface Arrival {
        predicted: string;
        scheduled: string;
    }

    interface Delay {
        is_available: boolean;
        minutes: number;
        seconds: number;
    }

    interface Route {
        short_name: string;
        type: number;
        is_night: boolean;
        is_regional: boolean;
        is_substitute_transport: boolean;
    }

    interface LastStop {
        id: string | null;
        name: string | null;
    }

    interface Trip {
        direction: string | null;
        headsign: string;
        id: string;
        is_at_stop: boolean;
        is_canceled: boolean;
        is_wheelchair_accessible: boolean;
        is_air_conditioned: boolean;
        short_name: string | null;
    }

    interface Departure {
        arrival_timestamp: Arrival;
        delay: Delay;
        departure_timestamp: Arrival & { minutes: string };
        last_stop: LastStop;
        route: Route;
        stop: {
            id: string;
            platform_code: string;
        };
        trip: Trip;
    }

    interface DepartureBoardResponse {
        stops: Stop[];
        departures: Departure[];
        infotexts: any[]; // Specify the type if you have more information about infotexts
    }

}