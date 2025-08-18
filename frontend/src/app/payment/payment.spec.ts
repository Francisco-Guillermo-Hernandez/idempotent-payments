import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { Payment } from './payment';
import { zodValidator } from '../utils/validator';
import { z } from 'zod';

describe('Payment Component', () => {
  let component: Payment;
  let fixture: ComponentFixture<Payment>;

  function createFormBuilder(): FormBuilder {
    return new FormBuilder();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Payment],
      imports: [ReactiveFormsModule, FormsModule],
      providers: [{ provide: FormBuilder, useFactory: createFormBuilder }],

      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Payment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
