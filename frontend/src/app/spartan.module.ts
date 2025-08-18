import { NgModule } from '@angular/core';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/brain/alert-dialog';
import {
  HlmAlertDialogActionButtonDirective,
  HlmAlertDialogCancelButtonDirective,
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogOverlayDirective,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/helm/alert-dialog';
import { HlmButtonDirective } from '@spartan-ng/helm/button';

import { HlmSpinnerComponent } from '@spartan-ng/helm/spinner';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import {
  lucideLoaderCircle,
  lucideChevronDown,
  lucideCheck,
} from '@ng-icons/lucide';

import { BrnCommandDirective } from '@spartan-ng/brain/command';
import { HlmCardModule } from '@spartan-ng/helm/card';

import { HlmCommandModule } from '@spartan-ng/helm/command';
import { HlmInputDirective } from '@spartan-ng/helm/input';
import { HlmLabelDirective } from '@spartan-ng/helm/label';

import { BrnSeparatorModule } from '@spartan-ng/brain/separator';
import { HlmSeparatorModule } from '@spartan-ng/helm/separator';
import { HlmToasterModule } from '@spartan-ng/helm/sonner';


import {
  HlmH1Directive,
  HlmH2Directive,
  HlmH3Directive,
  HlmH4Directive,
  HlmUlDirective,
  HlmCodeDirective,
  HlmLeadDirective,
  HlmLargeDirective,
  HlmMutedDirective,
  HlmSmallDirective,
  HlmBlockquoteDirective,
} from '@spartan-ng/helm/typography';


@NgModule({
  imports: [
    BrnAlertDialogTriggerDirective,
    BrnAlertDialogContentDirective,

    HlmAlertDialogComponent,
    HlmAlertDialogOverlayDirective,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogTitleDirective,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogCancelButtonDirective,
    HlmAlertDialogActionButtonDirective,
    HlmAlertDialogContentComponent,

    HlmButtonDirective,
    HlmIconDirective,
    HlmSpinnerComponent,

    HlmInputDirective,
    HlmLabelDirective,
    BrnCommandDirective,

    HlmCommandModule,
    HlmCardModule,

    HlmH1Directive,
    HlmH2Directive,
    HlmH3Directive,
    HlmH4Directive,
    HlmUlDirective,
    HlmCodeDirective,
    HlmLeadDirective,
    HlmLargeDirective,
    HlmMutedDirective,
    HlmSmallDirective,
    HlmBlockquoteDirective,
    BrnSeparatorModule,
    HlmSeparatorModule,

    HlmToasterModule,

  ],
  exports: [
    BrnAlertDialogTriggerDirective,
    BrnAlertDialogContentDirective,

    HlmAlertDialogComponent,
    HlmAlertDialogOverlayDirective,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogTitleDirective,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogCancelButtonDirective,
    HlmAlertDialogActionButtonDirective,
    HlmAlertDialogContentComponent,

    HlmButtonDirective,
    HlmIconDirective,
    HlmSpinnerComponent,

    HlmInputDirective,
    HlmLabelDirective,
    BrnCommandDirective,

    HlmCommandModule,
    HlmCardModule,

    HlmH1Directive,
    HlmH2Directive,
    HlmH3Directive,
    HlmH4Directive,
    HlmUlDirective,
    HlmCodeDirective,
    HlmLeadDirective,
    HlmLargeDirective,
    HlmMutedDirective,
    HlmSmallDirective,
    HlmBlockquoteDirective,
    BrnSeparatorModule,
    HlmSeparatorModule,
    HlmToasterModule,
  ],
  providers: [
    provideIcons({ lucideLoaderCircle, lucideChevronDown, lucideCheck }),
  ],
  declarations: [
  ],
})
export class SpartanModule {}
