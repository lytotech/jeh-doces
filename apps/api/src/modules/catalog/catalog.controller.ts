import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api')
@UseGuards(AuthGuard)
@UseInterceptors(CompanyContextInterceptor)
export class CatalogController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get('ingredients') getIngredients() { return this.database.database.getIngredients(); }
  @Post('ingredients') saveIngredient(@Body() body: any) { return this.database.database.saveIngredient(body); }
  @Put('ingredients/:id') updateIngredient(@Param('id') id: string, @Body() body: any) { return this.database.database.saveIngredient({ ...body, id }); }
  @Delete('ingredients/:id') deleteIngredient(@Param('id') id: string) { return this.database.database.deleteIngredient(id).then(success => ({ success })); }
  @Post('ingredients/:id/history') async addHistory(@Param('id') id: string, @Body() body: any) { const updated = await this.database.database.addPriceHistory(id, body); if (!updated) throw new NotFoundException('Ingredient not found'); return updated; }

  @Get('materials') getMaterials() { return this.database.database.getMaterials(); }
  @Post('materials') saveMaterial(@Body() body: any) { return this.database.database.saveMaterial(body); }
  @Put('materials/:id') updateMaterial(@Param('id') id: string, @Body() body: any) { return this.database.database.saveMaterial({ ...body, id }); }
  @Delete('materials/:id') deleteMaterial(@Param('id') id: string) { return this.database.database.deleteMaterial(id).then(success => ({ success })); }
  @Patch('materials/:id/stock') async adjustStock(@Param('id') id: string, @Body() body: any) { const updated = await this.database.database.adjustMaterialStock(id, Number(body.stockQuantity)); if (!updated) throw new NotFoundException('Material not found'); return updated; }

  @Get('products') getProducts() { return this.database.database.getProducts(); }
  @Post('products') saveProduct(@Body() body: any) { return this.database.database.saveProduct(body); }
  @Put('products/:id') updateProduct(@Param('id') id: string, @Body() body: any) { return this.database.database.saveProduct({ ...body, id }); }
  @Delete('products/:id') deleteProduct(@Param('id') id: string) { return this.database.database.deleteProduct(id).then(success => ({ success })); }
}
