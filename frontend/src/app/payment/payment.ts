import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { zodValidator } from '../utils/validator';
import { z } from 'zod';

@Component({
  selector: 'payment',
  standalone: false,
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment implements OnInit {

  private cardNumberSchema = z.string();
  private cardHolderSchema = z.string().min(8).max(60);
  private expiryDateSchema = z.string();
  private cvvSchema = z.string().min(3).max(3);
  public form!: FormGroup;
  constructor(
    private fb: FormBuilder,
  ) {


  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      cardNumber: ['', [zodValidator(this.cardNumberSchema)]],
      cardHolder: ['', [zodValidator(this.cardHolderSchema)]],
      expiryDate: ['', [zodValidator(this.expiryDateSchema)]],
      cvv: ['', [zodValidator(this.cvvSchema)]],
    });
  }

}
