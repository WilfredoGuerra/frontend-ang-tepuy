import { Component, input } from '@angular/core';
import { User } from '@auth/interfaces/user.interface';

@Component({
  selector: 'users-table',
  imports: [],
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent {
    user = input.required<User[]>();
 }
