// angular
import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

// ordercloud
import {
  OcAuthService,
  OcMeService,
  OcTokenService,
} from '@ordercloud/angular-sdk';
import {
  applicationConfiguration,
  AppConfig,
} from '@app-buyer/config/app.config';
import { AppAuthService } from '@app-buyer/auth/services/app-auth.service';
import { AppStateService } from '@app-buyer/shared';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'auth-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  isAnon: boolean;

  constructor(
    private ocAuthService: OcAuthService,
    private appAuthService: AppAuthService,
    private ocTokenService: OcTokenService,
    private ocMeService: OcMeService,
    private router: Router,
    private toastrService: ToastrService,
    private formBuilder: FormBuilder,
    private appStateService: AppStateService,
    @Inject(applicationConfiguration) public appConfig: AppConfig
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      username: '',
      password: '',
      rememberMe: false,
    });
    this.isAnon = this.appStateService.isAnonSubject.value;
  }

  onSubmit() {
    return this.ocAuthService
      .Login(
        this.form.get('username').value,
        this.form.get('password').value,
        this.appConfig.clientID,
        this.appConfig.scope
      )
      .subscribe((response) => {
        // console.log(response);
        const rememberMe = this.form.get('rememberMe').value;

        if (rememberMe && response.refresh_token) {
          /**
           * set the token duration in the dashboard - https://developer.ordercloud.io/dashboard/settings
           * refresh tokens are configured per clientID and initially set to 0
           * a refresh token of 0 means no refresh token is returned in OAuth response
           */
          this.ocTokenService.SetRefresh(response.refresh_token);
          this.appAuthService.setRememberStatus(true);
        }
        this.ocTokenService.SetAccess(response.access_token);
        this.ocMeService.Get().subscribe((res) => {
          console.log('get', res);
          if (!res.xp.isApproved) {
            this.appAuthService.logout();
            this.toastrService.error('User not approved');
          }
        });
        this.router.navigateByUrl('/home');
      });
  }

  showRegisterLink(): boolean {
    return this.isAnon && this.appConfig.anonymousShoppingEnabled;
  }
}
