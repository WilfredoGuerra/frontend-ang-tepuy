import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private closeModalSource = new Subject<void>();

  closeModal$ = this.closeModalSource.asObservable();

  close() {
    this.closeModalSource.next();
  }
}
