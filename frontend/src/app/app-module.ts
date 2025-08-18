import { NgModule, provideBrowserGlobalErrorListeners, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { SpartanModule } from './spartan.module'
import { AppRoutingModule } from './app.routing';
import { App } from './app';

import { MainCard } from './main-card/main-card';
import { Payment } from './payment/payment';
import { Details } from './details/details';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideEnvironmentNgxMask, NgxMaskConfig, NgxMaskDirective } from 'ngx-mask'

const maskConfig: Partial<NgxMaskConfig> = { validation: false };

@NgModule({
  declarations: [
    App,
    MainCard,
    Payment,
    Details,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SpartanModule,
    ReactiveFormsModule,
    FormsModule,
    NgxMaskDirective,

  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    provideEnvironmentNgxMask(maskConfig)
//     {
// provide: HTTP_INTERCEPTORS,
// useClass: ,
// multi: true,
// },
  ],
  bootstrap: [App],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AppModule { }
