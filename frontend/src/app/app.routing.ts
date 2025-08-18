import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainCard } from './main-card/main-card'

const routes: Routes = [
  {
    path: '',
    component: MainCard
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
