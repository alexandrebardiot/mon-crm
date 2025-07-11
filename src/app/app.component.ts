import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatMenuModule, RouterModule],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'mon-crm';
}
