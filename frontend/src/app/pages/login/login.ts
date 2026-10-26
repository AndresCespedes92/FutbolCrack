import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Presenta el acceso y sus enlaces. El envío se habilitará al incorporar autenticación.
@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {}
