namespace mhd {
    type VehicleType = "bus"|"tram"|"metro"|"train"|"trolleybus"|"ferry";
    interface Line {
        id: number;
        name: string;
        type: VehicleType;
        direction: string;
        isNight?: boolean;
    }
      
    interface Stop {
        id: string;
        platform: string;
        altIdosName: string;
        lat: number;
        lon: number;
        jtskX: number;
        jtskY: number;
        zone: string;
        mainTrafficType: VehicleType;
        wheelchairAccess: string;
        gtfsIds: string[];
        lines: Line[];
    }
      
    interface Station {
        name: string;
        districtCode: string;
        idosCategory: number;
        idosName: string;
        fullName: string;
        uniqueName: string;
        node: number;
        cis: number;
        avgLat: number;
        avgLon: number;
        avgJtskX: number;
        avgJtskY: number;
        municipality: string;
        mainTrafficType: string;
        stops: Stop[];
    }
    interface StopsResponse {
        generatedAt: string;
        dataFormatVersion: string;
        stopGroups: Station[];
    }
}