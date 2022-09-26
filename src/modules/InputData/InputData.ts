/*
 * Copyright 2018 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import {
  InputDataDevice,
  InputDataEndpoint,
  InputDataEndpointGroup,
  InputDataEndpointDataType,
  InputDataEndpointType,
} from './InputDataModel/InputDataModel';

import { ApiConnector } from '../ApiConnector';

type onDataFunctionType = (obj: InputDataDevice) => void;

/**
 * Simulation Class to generate data from an extrenal source
 *
 * @class InputData
 */
class InputData {
  /**
   * @private
   * @type {onDataFunctionType}
   * @memberof InputData
   */
  private onData: onDataFunctionType;

  /**
   * @private
   * @type {InputDataDevice[]}
   * @memberof InputData
   */
  private devices: InputDataDevice[];


  private apiConnector: ApiConnector;


  /**
   *Creates an instance of InputData.
   * @memberof InputData
   */
  constructor( apiConnector: ApiConnector) {
    const intervalTest = 2000;
    this.apiConnector = apiConnector;
    this.devices = [];
    this.onData = null;
    this.generateData();
    setInterval(this.onDataInterval.bind(this), intervalTest);
  }

  /**
   * @private
   * @memberof InputData
   */
  private onDataInterval() {
    if (this.onData !== null) {
      this.onData(this.getAndUpdateOneRandomDevice());
    }
  }

  /**
   * @param {onDataFunctionType} onData
   * @memberof InputData
   */
  public setOnDataCBFunc(onData: onDataFunctionType): void {
    this.onData = onData;
  }

  /**
   * @private
   * @memberof InputData
   */
  private async generateData() {
    const response = await this.apiConnector.get('https://dev.kone.com/api/v2/application/self/resources');
    const equipments = response.data.equipments;
    for( const equipment of equipments){
      const device = await this.generateDataDevice(equipment.id);
      this.devices.push(device);
    }
    
  }

  /**
   * @private
   * @returns {InputDataDevice}
   * @memberof InputData
   */
  private async generateDataDevice(id: number): Promise<InputDataDevice> {
    
    // Function to create a device or Endpoint Group
    function createFunc(
      str: string,
      type: string,
      constructor: typeof InputDataDevice | typeof InputDataEndpointGroup,
    ): any {
      return new constructor(str, type, str, '');
    }


    const device: InputDataDevice = createFunc(
      `${id}`,
      'device',
      InputDataDevice,
    );
    

    const movementResponse  = await this.apiConnector.post('https://dev.kone.com/api/v2/equipment/search/movement'
    ,{ equipmentIds: [`ken:${id}`] })
    
    const availabilityResponse = await this.apiConnector.post('https://dev.kone.com/api/v2/equipment/search/availability'
    ,{ equipmentIds: [`ken:${id}`] })

    if (!movementResponse.data[0] || !availabilityResponse.data[0]) return device;

    const entrapmentResponse = await this.apiConnector.post('https://dev.kone.com/api/v2/equipment/search/entrapment'
    ,{ equipmentIds: [`ken:${id}`] })

    const maintenanceResponse = await this.apiConnector.get('https://dev.kone.com/api/v1/equipment/ken:111111111/serviceOrders/9B0013021111')

    

    const movementEventType: InputDataEndpoint = new InputDataEndpoint(
      'MovementEvent',
      movementResponse.data[0].movementEventType,
      '',
      InputDataEndpointDataType.String,
      InputDataEndpointType.Other,
      `DEVICE-${id} MovementEventType`,
      '',
    );
    //console.log("movementEventType", movementEventType);
    const distance: InputDataEndpoint = new InputDataEndpoint(
      'Distance',
      movementResponse.data[0].distanceMeters,
      'm',
      InputDataEndpointDataType.Integer,
      InputDataEndpointType.Other,
      `DEVICE-${id} Distance`,
      '',
    );
    //console.log("distance", distance);

    const duration: InputDataEndpoint = new InputDataEndpoint(
      'Duration',
      movementResponse.data[0].durationSeconds,
      's',
      InputDataEndpointDataType.Duration,
      InputDataEndpointType.Other,
      `DEVICE-${id} Duration`,
      '',
    );
    //console.log("duration", duration);

    const estimatedPersons: InputDataEndpoint = new InputDataEndpoint(
      'Estimated Persons',
      movementResponse.data[0].decks[0].estimatedPersons,
      '',
      InputDataEndpointDataType.Integer,
      InputDataEndpointType.Other,
      `DEVICE-${id} Estimated Persons`,
      '',
    );
    //console.log("estimatedPersons", estimatedPersons);

    const loadPercentage: InputDataEndpoint = new InputDataEndpoint(
      'Load Percentage',
      movementResponse.data[0].decks[0].loadPercentage,
      '%',
      InputDataEndpointDataType.Integer,
      InputDataEndpointType.Other,
      `DEVICE-${id} Load Percentage`,
      '',
    );
    //console.log("loadPercentage", loadPercentage);

    const startFloor: InputDataEndpoint = new InputDataEndpoint(
      'Start Floor',
      movementResponse.data[0].decks[0].startFloor.marking,
      '',
      InputDataEndpointDataType.String,
      InputDataEndpointType.Other,
      `DEVICE-${id} Start Floor`,
      '',
    );
    //console.log("startFloor", startFloor);

    const stopFloor: InputDataEndpoint = new InputDataEndpoint(
      'Stop Floor',
      movementResponse.data[0].decks[0].stopFloor.marking,
      '',
      InputDataEndpointDataType.String,
      InputDataEndpointType.Other,
      `DEVICE-${id} Stop Floor`,
      '',
    );
    //console.log("stopFloor", stopFloor);


    const state : InputDataEndpoint = new InputDataEndpoint(
      'State',
      availabilityResponse.data[0].state,
      '',
      InputDataEndpointDataType.String,
      InputDataEndpointType.Other,
      `DEVICE-${id} State`,
      '',
    );

    const previousState: InputDataEndpoint = new InputDataEndpoint(
      'Previous State',
      availabilityResponse.data[0].previousState,
      '',
      InputDataEndpointDataType.String,
      InputDataEndpointType.Other,
      `DEVICE-${id} Previous State`,
      '',
    );
    
    const activeAlertCount: InputDataEndpoint = new InputDataEndpoint(
      'Active Alert Count',
      availabilityResponse.data[0].activeAlertCount,
      '',
      InputDataEndpointDataType.Integer,
      InputDataEndpointType.Other,
      `DEVICE-${id} Active Alert Count`,
      '',
    );

    const entrapment : InputDataEndpoint = new InputDataEndpoint(
      'Entrapment',
      entrapmentResponse.data[0].entrapment,
      '',
      InputDataEndpointDataType.Boolean,
      InputDataEndpointType.Other,
      `DEVICE-${id} Entrapment`,
      '',
    );
    const maintenanceStatus : InputDataEndpoint = new InputDataEndpoint(
      'Maintenance Status',
      entrapmentResponse.data[0].maintenance.status ? entrapmentResponse.data[0].maintenance.status : "No maintenance ongoing" ,
      '',
      InputDataEndpointDataType.String,
      InputDataEndpointType.Other,
      `DEVICE-${id} Maintenance Status`,
      '',
    );

    const maintenanceDescription : InputDataEndpoint = new InputDataEndpoint(
      'Maintenance Description',
       maintenanceResponse.data.description,
      '',
      InputDataEndpointDataType.String,
      InputDataEndpointType.Other,
      `DEVICE-${id} Maintenance Description`,
      '',
    );

    const maintenancePrice : InputDataEndpoint = new InputDataEndpoint(
      'Maintenance Price',
      maintenanceResponse.data.invoices[0].costAmount ,
      'EUR',
      InputDataEndpointDataType.Real,
      InputDataEndpointType.Other,
      `DEVICE-${id} Maintenance Price`,
      '',
    );

    device.children.push(movementEventType, distance, duration, estimatedPersons, loadPercentage, startFloor, stopFloor,
      state, previousState, activeAlertCount, entrapment, maintenanceStatus, maintenanceDescription, maintenancePrice);
    return device;
  }

  /**
   * @private
   * @param {(InputDataDevice)} device
   * @memberof InputData
   */
  private async updateDevice( device: InputDataDevice ): Promise<void> {
    let id = device.id;

    const movementResponse  = await this.apiConnector.post('https://dev.kone.com/api/v2/equipment/search/movement'
    ,{ equipmentIds: [`ken:${id}`] })
    
    const availabilityResponse = await this.apiConnector.post('https://dev.kone.com/api/v2/equipment/search/availability'
    ,{ equipmentIds: [`ken:${id}`] })

    if (!movementResponse.data[0] || !availabilityResponse.data[0]) return;

    const entrapmentResponse = await this.apiConnector.post('https://dev.kone.com/api/v2/equipment/search/entrapment'
    ,{ equipmentIds: [`ken:${id}`] })

    for (const child of device.children) {
      
      if (child instanceof InputDataEndpoint) {
      if (child.name === 'MovementEvent') {
          child.currentValue = movementResponse.data[0].movementEventType;
      } else if (child.name === 'Distance') {
        child.currentValue = movementResponse.data[0].distanceMeters;
      } else if (child.name === 'Duration') {
        child.currentValue = movementResponse.data[0].durationSeconds;
      } else if (child.name === 'Estimated Persons') {
        child.currentValue = movementResponse.data[0].decks[0].estimatedPersons;
      } else if (child.name === 'Load Percentage') {
        child.currentValue = movementResponse.data[0].decks[0].loadPercentage;
      } else if (child.name === 'Start Floor') {
        child.currentValue = movementResponse.data[0].decks[0].startFloor.marking;
      } else if (child.name === 'Stop Floor') {
        child.currentValue = movementResponse.data[0].decks[0].stopFloor.marking;
      } else if (child.name === 'State') {
        child.currentValue = availabilityResponse.data[0].state;
      } else if (child.name === 'Previous State') {
        child.currentValue = availabilityResponse.data[0].previousState;
      } else if (child.name === 'Active Alert Count') {
        child.currentValue = availabilityResponse.data[0].activeAlertCount;
      } else if (child.name === 'Entrapment') {
        child.currentValue = entrapmentResponse.data[0].entrapment;
      }

        }
        
    }

    console.log("lala", device);
  }

  /**
   * @private
   * @returns {InputDataDevice}
   * @memberof InputData
   */
  private getAndUpdateOneRandomDevice(): InputDataDevice {
    if (this.devices.length > 0) {
      const idx = Math.floor(Math.random() * this.devices.length);
      this.updateDevice(this.devices[idx]);
      return this.devices[idx];
    }
    //this.generateData();
    //return this.getAndUpdateOneRandomDevice();
  }
}

export { InputData };
