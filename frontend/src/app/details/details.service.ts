import { computed, Injectable, signal } from '@angular/core';
import { Bill } from '../utils/types';

@Injectable({
  providedIn: 'root'
})
export class DetailsService {

  private $bill = signal<Bill | null>(null);

  readonly bill = computed(() => this.$bill());

  public updateInformation(data: Bill): void {
    this.$bill.set(data);
  }

}
