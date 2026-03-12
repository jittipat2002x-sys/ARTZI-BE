import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { TenantsModule } from './tenants/tenants.module';
import { BranchesModule } from './branches/branches.module';
import { InventoryModule } from './inventory/inventory.module';
import { CustomersModule } from './customers/customers.module';
import { PetsModule } from './pets/pets.module';
import { MasterDataModule } from './master-data/master-data.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { VisitsModule } from './visits/visits.module';
import { MinioService } from './common/services/minio.service';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { WardsModule } from './wards/wards.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { ConsentFormsModule } from './consent-forms/consent-forms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MenusModule,
    TenantsModule,
    BranchesModule,
    InventoryModule,
    CustomersModule,
    PetsModule,
    MasterDataModule,
    VisitsModule,
    MedicalRecordsModule,
    AppointmentsModule,
    WardsModule,
    AdmissionsModule,
    DashboardModule,
    ReportsModule,
    ConsentFormsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MinioService,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
