export const request_identity = '0163';
export const sequence_number = '0005';
export const data_number_engine = '000f';
export const data_number_transmission = '000f';
export const data_number_machine = '000e';

export const request_end = 'c0';
export const health_engine = {
  EN001: {
    mid_uid: '002400010050',
    name: 'Air Filter Restriction',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN002: {
    mid_uid: '002400010029',
    name: 'Atmospheric Pressure ',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN003: {
    mid_uid: '002400010008',
    name: 'Boost Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN004: {
    mid_uid: '001b000115a6',
    name: 'DPF #1 Intake Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN005: {
    mid_uid: '001b00010e71',
    name: 'DPF #1 Intake Temperature',
    unit: '°C ',
    type: 'Engine',
    value: '',
  },
  EN006: {
    mid_uid: '002400010015',
    name: 'Engine Coolant Temperature',
    unit: '°C',
    type: 'Engine',
    value: '',
  },
  EN007: {
    mid_uid: '002400010009',
    name: 'Engine Oil Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN008: {
    mid_uid: '002400010236',
    name: 'Engine Power Derate (Réducteur)',
    unit: '%',
    type: 'Engine',
    value: '',
  },
  EN009: {
    mid_uid: '0024000100b2',
    name: 'Fuel Consumption Rate',
    unit: 'L/h',
    type: 'Engine',
    value: '',
  },

  EN010: {
    mid_uid: '002400010007',
    name: 'Fuel Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },

  EN011: {
    mid_uid: '002400011176',
    name: 'Intake Manifold Air Temperature ',
    unit: '°C',
    type: 'Engine',
    value: '',
  },
  EN012: {
    mid_uid: '004a00070004',
    name: 'Load Count',
    unit: '',
    type: 'Engine',
    value: '',
  },

  EN013: {
    mid_uid: '0024000100b4',
    name: 'Percent Engine Load at Current Engine Speed',
    unit: '%',
    type: 'Engine',
    value: '',
  },
  EN014: {
    mid_uid: '00510001038c',
    name: 'Powertrain Filter Bypass Status',
    unit: '',
    type: 'Engine',
    value: '',
  },
  EN015: {
    mid_uid: '002400010002',
    name: 'Throttle Position ',
    unit: '%',
    type: 'Engine',
    value: '',
  },
};
export const health_transmission = {
  TR001: {
    mid_uid: '005100010abd',
    name: 'Brake Accumulator Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  TR002: {
    mid_uid: '00510001041d',
    name: 'Brake Accumulator Pressure Status',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR003: {
    mid_uid: '00510001053a',
    name: 'Brake Oil Pressure Status',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR004: {
    mid_uid: '00510001039a',
    name: 'Brake Oil Pressure Warning Indicato',
    unit: '',
    type: 'Transmission',
    value: '',
  },

  TR005: {
    mid_uid: '002400010000',
    name: 'Engine Speed',
    unit: 'rpm',
    type: 'Transmission',
    value: '',
  },

  TR006: {
    mid_uid: '0051000100f7',
    name: 'Front Brake Pressure',
    unit: 'kPa',
    type: 'Transmission',
    value: '',
  },
  TR007: {
    mid_uid: '00510001005d',
    name: 'Gear',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR008: {
    mid_uid: '0051000a004f',
    name: 'Ground Speed',
    unit: 'mph',
    type: 'Transmission',
    value: '',
  },
  TR009: {
    mid_uid: '005100010275',
    name: 'Hydraulic Oil Add Level Switch Status',
    unit: '%',
    type: 'Transmission',
    value: '',
  },

  TR010: {
    mid_uid: '00510001026d',
    name: 'Lockup Clutch Enable Switch',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR011: {
    mid_uid: '005100010089',
    name: 'Neutralize Switch',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR012: {
    mid_uid: '0051000100e4',
    name: 'Parking Brake',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR013: {
    mid_uid: '0051000100fa',
    name: 'Rear Brake Pressure',
    unit: 'kPa',
    type: 'Transmission',
    value: '',
  },
  TR014: {
    mid_uid: '005100010101',
    name: 'Torque Converter Outlet Temperature',
    unit: '°C',
    type: 'Transmission',
    value: '',
  },
  TR015: {
    mid_uid: '0051000100b6',
    name: 'Transmission Oil Pressure',
    unit: 'kPa',
    type: 'Transmission',
    value: '',
  },
};
export const health_machine = {
  MA001: {
    mid_uid: '002700011a18',
    name: 'Front Axle Oil Pressure Switch Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA002: {
    mid_uid: '002700010105',
    name: 'Front Axle Oil Temperature ',
    unit: '°C',
    type: 'Machine',
    value: '',
  },
  MA003: {
    mid_uid: '00270001053c',
    name: 'Front Axle Oil Temperature Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA004: {
    mid_uid: '002700010184',
    name: 'Fuel Gauge ',
    unit: '%',
    type: 'Machine',
    value: '',
  },
  MA005: {
    mid_uid: '002700011648',
    name: 'Hydraulic Oil Add Level Switch Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA006: {
    mid_uid: '00270001005e',
    name: 'Hydraulic Oil Temperature',
    unit: '°C',
    type: 'Machine',
    value: '',
  },
  MA007: {
    mid_uid: '0027000100a9',
    name: 'Hydraulic Oil Temperature Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA008: {
    mid_uid: '002700011a19',
    name: 'Rear Axle Oil Pressure Switch Status M',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA009: {
    mid_uid: '002700010107',
    name: 'Rear Axle Oil Temperature',
    unit: '°C',
    type: 'Machine',
    value: '',
  },
  MA010: {
    mid_uid: '00270001053d',
    name: 'Rear Axle Oil Temperature Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA011: {
    mid_uid: '00a181010000',
    name: 'Timestamp Current',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA012: {
    mid_uid: '002400050003',
    name: 'Total Distance ',
    unit: 'km',
    type: 'Machine',
    value: '',
  },
  MA013: {
    mid_uid: '002400050004',
    name: 'Total Fuel',
    unit: 'gal',
    type: 'Machine',
    value: '',
  },

  MA014: {
    mid_uid: '004a000b002f',
    name: 'Total Pass Count',
    unit: '',
    type: 'Machine',
    value: '',
  },
};

export const health = {
  EN001: {
    mid_uid: '002400010050',
    name: 'Air Filter Restriction',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN002: {
    name: 'Atmospheric Pressure ',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN003: {
    name: 'Boost Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN004: {
    name: 'DPF #1 Intake Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN005: {
    name: 'DPF #1 Intake Temperature',
    unit: '°C ',
    type: 'Engine',
    value: '',
  },
  EN006: {
    name: 'Engine Coolant Temperature',
    unit: '°C',
    type: 'Engine',
    value: '',
  },
  EN007: {
    name: 'Engine Oil Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  EN008: {
    name: 'Engine Power Derate (Réducteur)',
    unit: '%',
    type: 'Engine',
    value: '',
  },
  EN009: {
    name: 'Fuel Consumption Rate',
    unit: 'L/h',
    type: 'Engine',
    value: '',
  },

  EN010: {
    name: 'Fuel Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },

  EN011: {
    name: 'Intake Manifold Air Temperature ',
    unit: '°C',
    type: 'Engine',
    value: '',
  },
  EN012: {
    name: 'Load Count',
    unit: '',
    type: 'Engine',
    value: '',
  },

  EN013: {
    name: 'Percent Engine Load at Current Engine Speed',
    unit: '%',
    type: 'Engine',
    value: '',
  },
  EN014: {
    name: 'Powertrain Filter Bypass Status',
    unit: '',
    type: 'Engine',
    value: '',
  },
  EN015: {
    name: 'Throttle Position ',
    unit: '%',
    type: 'Engine',
    value: '',
  },
  TR001: {
    name: 'Brake Accumulator Pressure',
    unit: 'kPa',
    type: 'Engine',
    value: '',
  },
  TR002: {
    name: 'Brake Accumulator Pressure Status',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR003: {
    name: 'Brake Oil Pressure Status',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR004: {
    name: 'Brake Oil Pressure Warning Indicato',
    unit: '',
    type: 'Transmission',
    value: '',
  },

  TR005: {
    name: 'Engine Speed',
    unit: 'rpm',
    type: 'Transmission',
    value: '',
  },

  TR006: {
    name: 'Front Brake Pressure',
    unit: 'kPa',
    type: 'Transmission',
    value: '',
  },
  TR007: {
    name: 'Gear',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR008: {
    name: 'Ground Speed',
    unit: 'mph',
    type: 'Transmission',
    value: '',
  },
  TR009: {
    name: 'Hydraulic Oil Add Level Switch Status',
    unit: '%',
    type: 'Transmission',
    value: '',
  },

  TR010: {
    name: 'Lockup Clutch Enable Switch',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR011: {
    name: 'Neutralize Switch',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR012: {
    name: 'Parking Brake',
    unit: '',
    type: 'Transmission',
    value: '',
  },
  TR013: {
    name: 'Rear Brake Pressure',
    unit: 'kPa',
    type: 'Transmission',
    value: '',
  },
  TR014: {
    name: 'Torque Converter Outlet Temperature',
    unit: '°C',
    type: 'Transmission',
    value: '',
  },
  TR015: {
    name: 'Transmission Oil Pressure',
    unit: 'kPa',
    type: 'Transmission',
    value: '',
  },
  MA001: {
    name: 'Front Axle Oil Pressure Switch Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA002: {
    name: 'Front Axle Oil Temperature ',
    unit: '°C',
    type: 'Machine',
    value: '',
  },
  MA003: {
    name: 'Front Axle Oil Temperature Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA004: {
    name: 'Fuel Gauge ',
    unit: '%',
    type: 'Machine',
    value: '',
  },
  MA005: {
    name: 'Hydraulic Oil Add Level Switch Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA006: {
    name: 'Hydraulic Oil Temperature',
    unit: '°C',
    type: 'Machine',
    value: '',
  },
  MA007: {
    name: 'Hydraulic Oil Temperature Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA008: {
    name: 'Rear Axle Oil Pressure Switch Status M',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA009: {
    name: 'Rear Axle Oil Temperature',
    unit: '°C',
    type: 'Machine',
    value: '',
  },
  MA010: {
    name: 'Rear Axle Oil Temperature Status',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA011: {
    name: 'Timestamp Current',
    unit: '',
    type: 'Machine',
    value: '',
  },
  MA012: {
    name: 'Total Distance ',
    unit: 'km',
    type: 'Machine',
    value: '',
  },
  MA013: {
    name: 'Total Fuel',
    unit: 'gal',
    type: 'Machine',
    value: '',
  },

  MA014: {
    name: 'Total Pass Count',
    unit: '',
    type: 'Machine',
    value: '',
  },
};
