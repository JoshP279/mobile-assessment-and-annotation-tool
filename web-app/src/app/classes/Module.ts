/**
 * Module class that stores the module code and module name.
 */
export class Module{
    ModuleCode: string;
    ModuleName: string;
    constructor(ModuleCode: string, ModuleName:string) {
      this.ModuleCode = ModuleCode;
      this.ModuleName = ModuleName;
    }
  }