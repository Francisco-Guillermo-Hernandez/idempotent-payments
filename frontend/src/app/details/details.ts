import { Component, inject } from '@angular/core';
import { DetailsService } from './details.service';

@Component({
  selector: 'bill-details',
  standalone: false,
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details {

  public detailsService = inject(DetailsService);
  public get bill() {
    return this.detailsService.bill();
  }
}
