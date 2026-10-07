export type OccupancyState = 'SEATS AVAILABLE' | 'STANDING AVAILABLE' | 'LIMITED STANDING';

export type DeckType = 'Double Decker' | 'Single Deck' | 'Double Deck';

export interface BusArrivalSlot {
  label: 'NEXT BUS' | 'SUBSEQUENT BUS' | '3RD BUS';
  occupancy: OccupancyState;
  mins: number;
  estimatedTime: string;
  deckType: 'Double Decker' | 'Single Deck';
  wab: boolean;
}

export interface EnRouteStop {
  step: number;
  name: string;
  code: string;
  etaDelta: string;
}

export interface NearbyService {
  serviceNo: string;
  destination: string;
  occupancyShort: 'SEATS AVAIL' | 'STANDING AVAIL' | 'LIMITED STANDING';
  occupancyType: OccupancyState;
  mins: number;
  subsequentMins: number;
  deckType: 'Double Deck' | 'Single Deck';
  wab: boolean;
}

export interface BusStopOption {
  code: string;
  name: string;
  road: string;
  corridor: string;
}

export interface BusServiceData {
  serviceNo: string;
  label: string;
  activeFleet: number;
  directions: {
    [dirKey in '1' | '2']: {
      directionTitle: string;
      activeDirectionLabel: string;
      origin: string;
      destination: string;
      distanceKm: string;
      congestion: 'Light' | 'Moderate' | 'Clear';
      stops: BusStopOption[];
      arrivalsByStop: {
        [stopCode: string]: {
          slots: [BusArrivalSlot, BusArrivalSlot, BusArrivalSlot];
          enRouteStops: EnRouteStop[];
          nearbyServices: NearbyService[];
        };
      };
    };
  };
}

export interface NewsItem {
  id: string;
  category: 'ROUTE UPDATE' | 'ROAD CLOSURE' | 'INNOVATION';
  categoryColor: 'orange' | 'red' | 'green';
  date: string;
  title: string;
  summary: string;
  fullDetails: string;
}

export const NEWS_ANNOUNCEMENTS: NewsItem[] = [
  {
    id: 'news-1',
    category: 'ROUTE UPDATE',
    categoryColor: 'orange',
    date: '07 Oct 2026',
    title: 'Changes To Bus Services And Boarding Berths At Sengkang Bus Interchange',
    summary: 'Affects Services 83, 156, 371',
    fullDetails:
      'Effective Sunday, 11 October 2026, boarding berths at Sengkang Integrated Transport Hub will be adjusted to improve commuter flow during peak hours. Service 83 moves to Berth B4, Service 156 to Berth B6, and Service 371 to Berth B2.'
  },
  {
    id: 'news-2',
    category: 'ROAD CLOSURE',
    categoryColor: 'red',
    date: '01 Oct 2026',
    title: 'Service 16/16M Affected by Road Closure for Joo Chiat Car-Free Day',
    summary: 'Diversions in place',
    fullDetails:
      'Services 16 and 16M will skip 4 bus stops along Joo Chiat Road and East Coast Road this Sunday from 07:00 to 18:00 due to the community Car-Free Sunday event.'
  },
  {
    id: 'news-3',
    category: 'INNOVATION',
    categoryColor: 'green',
    date: '24 Sep 2026',
    title: 'SBS Transit Trials AI for More Reliable Bus Arrivals',
    summary: 'Predictive fleet dispatch',
    fullDetails:
      'New real-time headway optimization system deployed across 12 trunk routes reduces bus bunching by 28% and improves wheelchair bay availability predictions.'
  }
];

export const BUS_SERVICES: BusServiceData[] = [
  {
    serviceNo: '65',
    label: '65 - Tampines Int ↔ HarbourFront Int',
    activeFleet: 114,
    directions: {
      '1': {
        directionTitle: 'TO HARBOURFRONT INT',
        activeDirectionLabel: 'Towards HarbourFront Int (via Clarke Quay, Chinatown)',
        origin: 'Tampines Concourse',
        destination: 'HarbourFront Int',
        distanceKm: '22.4 km',
        congestion: 'Light',
        stops: [
          {
            code: '04229',
            name: 'High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Corridor'
          },
          {
            code: '04239',
            name: 'Clarke Quay Stn',
            road: 'Eu Tong Sen St',
            corridor: 'Eu Tong Sen Street Corridor'
          },
          {
            code: '05013',
            name: 'Chinatown Stn',
            road: 'New Bridge Rd',
            corridor: 'Chinatown Heritage Corridor'
          },
          {
            code: '14141',
            name: 'HarbourFront Stn',
            road: 'Telok Blangah Rd',
            corridor: 'Southern Waterfront Corridor'
          }
        ],
        arrivalsByStop: {
          '04229': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 2,
                estimatedTime: '14:32:45',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 8,
                estimatedTime: '14:38:10',
                deckType: 'Single Deck',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'LIMITED STANDING',
                mins: 17,
                estimatedTime: '14:47:30',
                deckType: 'Double Decker',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'CLARKE QUAY STN', code: '04239', etaDelta: '+2 min' },
              { step: 2, name: 'CHINATOWN STN', code: '05013', etaDelta: '+5 min' },
              { step: 3, name: 'OUTRAM PK STN', code: '06011', etaDelta: '+9 min' },
              { step: 4, name: 'TIONG BAHRU STN', code: '10169', etaDelta: '+14 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '147',
                destination: 'TO JURONG EAST INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 4,
                subsequentMins: 12,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 6,
                subsequentMins: 14,
                deckType: 'Single Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 11,
                subsequentMins: 23,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          },
          '04239': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 4,
                estimatedTime: '14:34:50',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 10,
                estimatedTime: '14:40:15',
                deckType: 'Single Deck',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 19,
                estimatedTime: '14:49:30',
                deckType: 'Double Decker',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'CHINATOWN STN', code: '05013', etaDelta: '+3 min' },
              { step: 2, name: 'OUTRAM PK STN', code: '06011', etaDelta: '+7 min' },
              { step: 3, name: 'TIONG BAHRU STN', code: '10169', etaDelta: '+12 min' },
              { step: 4, name: 'HARBOURFRONT INT', code: '14009', etaDelta: '+18 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '147',
                destination: 'TO JURONG EAST INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 6,
                subsequentMins: 14,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 8,
                subsequentMins: 16,
                deckType: 'Single Deck',
                wab: true
              },
              {
                serviceNo: '54',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 3,
                subsequentMins: 15,
                deckType: 'Single Deck',
                wab: true
              }
            ]
          },
          '05013': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 3,
                estimatedTime: '14:33:20',
                deckType: 'Single Deck',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 9,
                estimatedTime: '14:39:40',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 16,
                estimatedTime: '14:46:15',
                deckType: 'Double Decker',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'OUTRAM PK STN', code: '06011', etaDelta: '+4 min' },
              { step: 2, name: 'TIONG BAHRU STN', code: '10169', etaDelta: '+9 min' },
              { step: 3, name: 'REDHILL STN', code: '10209', etaDelta: '+13 min' },
              { step: 4, name: 'HARBOURFRONT INT', code: '14009', etaDelta: '+19 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '147',
                destination: 'TO JURONG EAST INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 2,
                subsequentMins: 10,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 5,
                subsequentMins: 13,
                deckType: 'Single Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 7,
                subsequentMins: 19,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          },
          '14141': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 1,
                estimatedTime: '14:31:50',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 11,
                estimatedTime: '14:41:20',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 21,
                estimatedTime: '14:51:05',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'HARBOURFRONT INT', code: '14009', etaDelta: '+2 min' },
              { step: 2, name: 'VIVO CITY TERM', code: '14119', etaDelta: '+4 min' },
              { step: 3, name: 'KEPPEL RD TERMINAL', code: '14089', etaDelta: '+7 min' },
              { step: 4, name: 'TANJONG PAGAR', code: '03219', etaDelta: '+11 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '10',
                destination: 'TO KENT RIDGE TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 3,
                subsequentMins: 11,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '30',
                destination: 'TO BOON LAY INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 5,
                subsequentMins: 14,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '97',
                destination: 'TO JURONG EAST INT',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 8,
                subsequentMins: 17,
                deckType: 'Single Deck',
                wab: true
              }
            ]
          }
        }
      },
      '2': {
        directionTitle: 'TO TAMPINES INT',
        activeDirectionLabel: 'Towards Tampines Int (via Bugis, Serangoon, Bedok North)',
        origin: 'HarbourFront Int',
        destination: 'Tampines Concourse',
        distanceKm: '22.8 km',
        congestion: 'Moderate',
        stops: [
          {
            code: '04222',
            name: 'Opp High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Northbound Corridor'
          },
          {
            code: '07551',
            name: 'Bugis Junction',
            road: 'Victoria St',
            corridor: 'Victoria Street Heritage Corridor'
          },
          {
            code: '66311',
            name: 'Serangoon Stn Exit C',
            road: 'Upper Serangoon Rd',
            corridor: 'North-East Transit Corridor'
          }
        ],
        arrivalsByStop: {
          '04222': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 5,
                estimatedTime: '14:35:15',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 13,
                estimatedTime: '14:43:00',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 22,
                estimatedTime: '14:52:40',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'STAMFORD CT', code: '04121', etaDelta: '+3 min' },
              { step: 2, name: 'BUGIS STN', code: '01112', etaDelta: '+7 min' },
              { step: 3, name: 'LAVENDER STN', code: '01311', etaDelta: '+11 min' },
              { step: 4, name: 'BOON KENG STN', code: '60081', etaDelta: '+16 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '147',
                destination: 'TO HOUGANG CTRL INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 3,
                subsequentMins: 11,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO CHOA CHU KANG INT',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 7,
                subsequentMins: 15,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO PASIR RIS INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 9,
                subsequentMins: 20,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          },
          '07551': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 3,
                estimatedTime: '14:33:10',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 11,
                estimatedTime: '14:41:25',
                deckType: 'Single Deck',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 19,
                estimatedTime: '14:49:00',
                deckType: 'Double Decker',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'LAVENDER STN', code: '01311', etaDelta: '+4 min' },
              { step: 2, name: 'BENDEMEER RD', code: '60051', etaDelta: '+8 min' },
              { step: 3, name: 'POTONG PASIR STN', code: '60261', etaDelta: '+13 min' },
              { step: 4, name: 'SERANGOON STN', code: '66311', etaDelta: '+18 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '2',
                destination: 'TO CHANGI VILLAGE TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 4,
                subsequentMins: 12,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO PASIR RIS INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 6,
                subsequentMins: 16,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '133',
                destination: 'TO ANG MO KIO INT',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 8,
                subsequentMins: 19,
                deckType: 'Single Deck',
                wab: true
              }
            ]
          },
          '66311': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 6,
                estimatedTime: '14:36:05',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 14,
                estimatedTime: '14:44:20',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 23,
                estimatedTime: '14:53:10',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'BARTLEY STN', code: '62041', etaDelta: '+4 min' },
              { step: 2, name: 'TEMASEK POLY', code: '75231', etaDelta: '+11 min' },
              { step: 3, name: 'TAMPINES WEST STN', code: '75141', etaDelta: '+15 min' },
              { step: 4, name: 'TAMPINES INT', code: '75009', etaDelta: '+19 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '43',
                destination: 'TO UPPER EAST COAST',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 3,
                subsequentMins: 10,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '70',
                destination: 'TO YIO CHU KANG INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 5,
                subsequentMins: 13,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '109',
                destination: 'TO CHANGI VILLAGE TER',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 9,
                subsequentMins: 18,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          }
        }
      }
    }
  },
  {
    serviceNo: '147',
    label: '147 - Hougang Ctrl Int ↔ Clementi Int',
    activeFleet: 96,
    directions: {
      '1': {
        directionTitle: 'TO CLEMENTI INT',
        activeDirectionLabel: 'Towards Clementi Int (via Hill St, Outram Park, Queensway)',
        origin: 'Hougang Central Int',
        destination: 'Clementi Int',
        distanceKm: '25.1 km',
        congestion: 'Light',
        stops: [
          {
            code: '04229',
            name: 'High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Corridor'
          },
          {
            code: '05013',
            name: 'Chinatown Stn',
            road: 'New Bridge Rd',
            corridor: 'Chinatown Heritage Corridor'
          }
        ],
        arrivalsByStop: {
          '04229': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 4,
                estimatedTime: '14:34:12',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 12,
                estimatedTime: '14:42:05',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 20,
                estimatedTime: '14:50:40',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'CLARKE QUAY STN', code: '04239', etaDelta: '+2 min' },
              { step: 2, name: 'CHINATOWN STN', code: '05013', etaDelta: '+5 min' },
              { step: 3, name: 'OUTRAM PK STN', code: '06011', etaDelta: '+8 min' },
              { step: 4, name: 'QUEENSWAY SHOP CTR', code: '11059', etaDelta: '+16 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '65',
                destination: 'TO HARBOURFRONT INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 2,
                subsequentMins: 8,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 6,
                subsequentMins: 14,
                deckType: 'Single Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 11,
                subsequentMins: 23,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          },
          '05013': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 2,
                estimatedTime: '14:32:15',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 10,
                estimatedTime: '14:40:30',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 18,
                estimatedTime: '14:48:45',
                deckType: 'Double Decker',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'OUTRAM PK STN', code: '06011', etaDelta: '+3 min' },
              { step: 2, name: 'BUKIT MERAH CTRL', code: '10099', etaDelta: '+9 min' },
              { step: 3, name: 'QUEENSWAY SHOP CTR', code: '11059', etaDelta: '+14 min' },
              { step: 4, name: 'CLEMENTI INT', code: '17009', etaDelta: '+22 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '65',
                destination: 'TO HARBOURFRONT INT',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 3,
                subsequentMins: 9,
                deckType: 'Single Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 5,
                subsequentMins: 13,
                deckType: 'Single Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 8,
                subsequentMins: 19,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          }
        }
      },
      '2': {
        directionTitle: 'TO HOUGANG CTRL INT',
        activeDirectionLabel: 'Towards Hougang Ctrl Int (via Lavender, Boon Keng, Kovan)',
        origin: 'Clementi Int',
        destination: 'Hougang Central Int',
        distanceKm: '25.4 km',
        congestion: 'Light',
        stops: [
          {
            code: '04222',
            name: 'Opp High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Northbound Corridor'
          }
        ],
        arrivalsByStop: {
          '04222': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 3,
                estimatedTime: '14:33:45',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 11,
                estimatedTime: '14:41:10',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 19,
                estimatedTime: '14:49:30',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'STAMFORD CT', code: '04121', etaDelta: '+2 min' },
              { step: 2, name: 'LAVENDER STN', code: '01311', etaDelta: '+8 min' },
              { step: 3, name: 'SERANGOON STN', code: '66311', etaDelta: '+16 min' },
              { step: 4, name: 'HOUGANG CTRL INT', code: '64009', etaDelta: '+24 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '65',
                destination: 'TO TAMPINES INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 5,
                subsequentMins: 13,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO CHOA CHU KANG INT',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 7,
                subsequentMins: 15,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO PASIR RIS INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 9,
                subsequentMins: 20,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          }
        }
      }
    }
  },
  {
    serviceNo: '190',
    label: '190 - Choa Chu Kang Int ↔ Kampong Bahru Ter',
    activeFleet: 88,
    directions: {
      '1': {
        directionTitle: 'TO KAMPONG BAHRU TER',
        activeDirectionLabel: 'Towards Kampong Bahru Ter (via Orchard Rd, Dhoby Ghaut, Hill St)',
        origin: 'Choa Chu Kang Int',
        destination: 'Kampong Bahru Ter',
        distanceKm: '21.0 km',
        congestion: 'Light',
        stops: [
          {
            code: '04229',
            name: 'High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Corridor'
          }
        ],
        arrivalsByStop: {
          '04229': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 6,
                estimatedTime: '14:36:10',
                deckType: 'Single Deck',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 14,
                estimatedTime: '14:44:20',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 21,
                estimatedTime: '14:51:50',
                deckType: 'Double Decker',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'CLARKE QUAY STN', code: '04239', etaDelta: '+2 min' },
              { step: 2, name: 'CHINATOWN STN', code: '05013', etaDelta: '+5 min' },
              { step: 3, name: 'OUTRAM PK STN', code: '06011', etaDelta: '+8 min' },
              { step: 4, name: 'KAMPONG BAHRU TER', code: '10499', etaDelta: '+11 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '65',
                destination: 'TO HARBOURFRONT INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 2,
                subsequentMins: 8,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '147',
                destination: 'TO JURONG EAST INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 4,
                subsequentMins: 12,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 11,
                subsequentMins: 23,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          }
        }
      },
      '2': {
        directionTitle: 'TO CHOA CHU KANG INT',
        activeDirectionLabel: 'Towards Choa Chu Kang Int (via Somerset, Stevens Rd, Bukit Panjang)',
        origin: 'Kampong Bahru Ter',
        destination: 'Choa Chu Kang Int',
        distanceKm: '21.2 km',
        congestion: 'Light',
        stops: [
          {
            code: '04222',
            name: 'Opp High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Northbound Corridor'
          }
        ],
        arrivalsByStop: {
          '04222': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 7,
                estimatedTime: '14:37:00',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 15,
                estimatedTime: '14:45:15',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 24,
                estimatedTime: '14:54:10',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'DHOBY GHAUT STN', code: '08057', etaDelta: '+4 min' },
              { step: 2, name: 'ORCHARD STN', code: '09023', etaDelta: '+9 min' },
              { step: 3, name: 'STEVENS STN', code: '40081', etaDelta: '+14 min' },
              { step: 4, name: 'BUKIT PANJANG PLAZA', code: '44259', etaDelta: '+26 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '65',
                destination: 'TO TAMPINES INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 5,
                subsequentMins: 13,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '147',
                destination: 'TO HOUGANG CTRL INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 3,
                subsequentMins: 11,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '12',
                destination: 'TO PASIR RIS INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 9,
                subsequentMins: 20,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          }
        }
      }
    }
  },
  {
    serviceNo: '12',
    label: '12 - Pasir Ris Int ↔ Kampong Bahru Ter',
    activeFleet: 74,
    directions: {
      '1': {
        directionTitle: 'TO KAMPONG BAHRU TER',
        activeDirectionLabel: 'Towards Kampong Bahru Ter (via Bugis, Hill St, Chinatown)',
        origin: 'Pasir Ris Int',
        destination: 'Kampong Bahru Ter',
        distanceKm: '23.6 km',
        congestion: 'Light',
        stops: [
          {
            code: '04229',
            name: 'High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Corridor'
          }
        ],
        arrivalsByStop: {
          '04229': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 11,
                estimatedTime: '14:41:00',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 23,
                estimatedTime: '14:53:10',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 34,
                estimatedTime: '15:04:15',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'CLARKE QUAY STN', code: '04239', etaDelta: '+2 min' },
              { step: 2, name: 'CHINATOWN STN', code: '05013', etaDelta: '+5 min' },
              { step: 3, name: 'OUTRAM PK STN', code: '06011', etaDelta: '+8 min' },
              { step: 4, name: 'KAMPONG BAHRU TER', code: '10499', etaDelta: '+11 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '65',
                destination: 'TO HARBOURFRONT INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 2,
                subsequentMins: 8,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '147',
                destination: 'TO JURONG EAST INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 4,
                subsequentMins: 12,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO KAMPONG BAHRU TER',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 6,
                subsequentMins: 14,
                deckType: 'Single Deck',
                wab: true
              }
            ]
          }
        }
      },
      '2': {
        directionTitle: 'TO PASIR RIS INT',
        activeDirectionLabel: 'Towards Pasir Ris Int (via Bugis, East Coast, Tampines)',
        origin: 'Kampong Bahru Ter',
        destination: 'Pasir Ris Int',
        distanceKm: '23.9 km',
        congestion: 'Light',
        stops: [
          {
            code: '04222',
            name: 'Opp High St Ctr',
            road: 'Hill St',
            corridor: 'Hill Street Northbound Corridor'
          }
        ],
        arrivalsByStop: {
          '04222': {
            slots: [
              {
                label: 'NEXT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 9,
                estimatedTime: '14:39:05',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: 'SUBSEQUENT BUS',
                occupancy: 'SEATS AVAILABLE',
                mins: 20,
                estimatedTime: '14:50:15',
                deckType: 'Double Decker',
                wab: true
              },
              {
                label: '3RD BUS',
                occupancy: 'STANDING AVAILABLE',
                mins: 31,
                estimatedTime: '15:01:20',
                deckType: 'Single Deck',
                wab: true
              }
            ],
            enRouteStops: [
              { step: 1, name: 'STAMFORD CT', code: '04121', etaDelta: '+3 min' },
              { step: 2, name: 'BUGIS STN', code: '01112', etaDelta: '+7 min' },
              { step: 3, name: 'KALLANG STN', code: '80031', etaDelta: '+13 min' },
              { step: 4, name: 'PASIR RIS INT', code: '77009', etaDelta: '+35 min' }
            ],
            nearbyServices: [
              {
                serviceNo: '65',
                destination: 'TO TAMPINES INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 5,
                subsequentMins: 13,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '147',
                destination: 'TO HOUGANG CTRL INT',
                occupancyShort: 'SEATS AVAIL',
                occupancyType: 'SEATS AVAILABLE',
                mins: 3,
                subsequentMins: 11,
                deckType: 'Double Deck',
                wab: true
              },
              {
                serviceNo: '190',
                destination: 'TO CHOA CHU KANG INT',
                occupancyShort: 'STANDING AVAIL',
                occupancyType: 'STANDING AVAILABLE',
                mins: 7,
                subsequentMins: 15,
                deckType: 'Double Deck',
                wab: true
              }
            ]
          }
        }
      }
    }
  }
];

export const ALL_BUS_STOPS: BusStopOption[] = [
  { code: '04229', name: 'High St Ctr', road: 'Hill St', corridor: 'Hill Street Corridor' },
  { code: '04239', name: 'Clarke Quay Stn', road: 'Eu Tong Sen St', corridor: 'Eu Tong Sen Street Corridor' },
  { code: '05013', name: 'Chinatown Stn', road: 'New Bridge Rd', corridor: 'Chinatown Heritage Corridor' },
  { code: '14141', name: 'HarbourFront Stn', road: 'Telok Blangah Rd', corridor: 'Southern Waterfront Corridor' },
  { code: '04222', name: 'Opp High St Ctr', road: 'Hill St', corridor: 'Hill Street Northbound Corridor' },
  { code: '07551', name: 'Bugis Junction', road: 'Victoria St', corridor: 'Victoria Street Heritage Corridor' },
  { code: '66311', name: 'Serangoon Stn Exit C', road: 'Upper Serangoon Rd', corridor: 'North-East Transit Corridor' }
];
