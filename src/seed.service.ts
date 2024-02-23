// import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
// import { StatusService } from './status/status.service';

// @Injectable()
// export class SeedService implements OnApplicationBootstrap {
//   constructor(private status: StatusService) {}
//   async onApplicationBootstrap(): Promise<any> {
//     await this.status.createIfNotExist({
//       total_alert: 0,
//       total_event: 0,
//       delta: 60 * 4 * 1000,
//       shut: 0,
//       engine_status: '',
//     });
//   }
// }
