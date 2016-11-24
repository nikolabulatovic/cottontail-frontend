import {Component, Input, forwardRef} from "@angular/core";
import {
    Validators,
    FormControl,
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    FormGroup,
    FormBuilder,
    NG_VALIDATORS
} from "@angular/forms";
import {ExpressionModel, CommandInputParameterModel as InputProperty} from "cwlts/models/d2sb";
import {ToggleComponent} from "../../../editor-common/components/toggle-slider/toggle-slider.component";
import {InputTypeSelectComponent} from "../../common/type-select/type-select.component";
import {ComponentBase} from "../../../components/common/component-base";
import {CustomValidators} from "../../../validators/custom.validator";

require("./basic-input-section.component.scss");

@Component({
    selector: "basic-input-section",
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BasicInputSectionComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => BasicInputSectionComponent), multi: true }
    ],
    directives: [
        ToggleComponent,
        InputTypeSelectComponent
    ],
    template: `
          <form class="basic-input-section" *ngIf="selectedProperty">
                <div class="form-group flex-container">
                    <label>Required</label>
                    <span class="align-right">
                        {{selectedProperty.isRequired ? "Yes" : "No"}}
                        <toggle-slider [(checked)]="selectedProperty.isRequired"></toggle-slider>
                    </span>
                </div>
            
                <div class="form-group">
                    <label>ID</label>
                    <input type="text" 
                           class="form-control"
                           [formControl]="propertyIdForm">
                </div>
                
                <div class="form-group" *ngIf="typeForm">
                    <label for="inputType">Type</label>
                    <input-type-select [formControl]="typeForm"></input-type-select>
                </div>
                
                <div class="form-group flex-container">
                    <label>Include in command line</label>
                    
                    <span class="align-right">
                        {{selectedProperty.isBound ? "Yes" : "No"}}
                        <toggle-slider [(checked)]="selectedProperty.isBound"
                                       (checkedChange)="toggleInputBinding(selectedProperty.isBound)"></toggle-slider>
                    </span>
                </div>
                
               <div class="form-group" *ngIf="inputBindingFormGroup">
                    <label>Value</label>
                    <expression-input
                                [context]="context"
                                [formControl]="inputBindingFormGroup.controls['expressionInput']">
                    </expression-input>
                
                    <label>Position</label>
                    <input class="form-control"
                           type="number"
                           [formControl]="inputBindingFormGroup.controls['position']"/>
                
                    <label>Prefix</label>
                    <input class="form-control"
                           [formControl]="inputBindingFormGroup.controls['prefix']"/>
                           
                   <label>Separator</label>
                   <select class="form-control" 
                           [formControl]="inputBindingFormGroup.controls['separate']">
                        <option *ngFor="let separatorOption of separatorOptions" 
                                [value]="separatorOption.value"
                                [selected]="separatorOption.value === !!selectedProperty.inputBinding.separate">
                            {{separatorOption.text}}
                        </option>
                   </select>
                   
                   <div *ngIf="selectedProperty.type.type === 'array'">
                        <label>Item Separator</label>
                        <select class="form-control" 
                                [formControl]="inputBindingFormGroup.controls['itemSeparator']">
                            <option *ngFor="let itemSeparator of itemSeparators" 
                                    [value]="itemSeparator.value"
                                    [selected]="itemSeparator.value == selectedProperty.inputBinding.itemSeparator">
                                {{itemSeparator.text}}
                            </option>
                        </select>
                   </div>
                   
                </div> <!--inputBindingFormGroup-->
            </form> <!--basic-input-section-->
    `
})
/**
 * TODO: handle map, record and array types
 * */
export class BasicInputSectionComponent extends ComponentBase implements ControlValueAccessor {

    @Input()
    public context: {$job: any, $self: any};

    /** The currently displayed property */
    private selectedProperty: InputProperty;

    private inputBindingFormGroup: FormGroup;

    private propertyIdForm: FormControl;

    private typeForm: FormControl;

    private separatorOptions: {text: string, value: boolean}[] = [
        { text: "space", value: true },
        { text: "empty string", value: false }
    ];

    private itemSeparators: {text: string, value: string}[] = [
        { text: "equal", value: "=" },
        { text: "comma", value: "," },
        { text: "semicolon", value: ";" },
        { text: "space", value: " " },
        { text: "repeat", value: null }
    ];

    private onTouched = () => { };

    private propagateChange = (_) => {};

    constructor(private formBuilder: FormBuilder) {
        super();
    }

    private writeValue(property: InputProperty): void {
        this.selectedProperty = property;
        this.typeForm = new FormControl(this.selectedProperty.type, [Validators.required, CustomValidators.cwlModel]);
        this.propertyIdForm = new FormControl(this.selectedProperty.id);

        if (this.selectedProperty.isBound) {
            this.createExpressionInputForm(this.selectedProperty);
        } else {
            this.inputBindingFormGroup = undefined;
        }

        this.tracked = this.typeForm.valueChanges.subscribe(_ => {
            if (this.selectedProperty.type.type !== 'array' && this.selectedProperty.isBound) {
                this.selectedProperty.inputBinding.itemSeparator = undefined;
            }
            this.propagateChange(this.selectedProperty);
        });

        this.tracked = this.propertyIdForm.valueChanges.subscribe(_ => {
            this.propagateChange(this.selectedProperty);
        });
    }

    private registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    private registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    private validate(c: FormControl) {
        let isValid = false;

        if (!!this.inputBindingFormGroup) {
            isValid = this.inputBindingFormGroup.valid && this.typeForm.valid && this.propertyIdForm.valid;
        } else {
            isValid = this.typeForm.valid && this.propertyIdForm.valid;
        }

        return !!isValid ? null: { error: "Basic input section is not valid." }
    }

    private createExpressionInputForm(property: InputProperty): void {
        const valueFrom = !!property.getValueFrom() ? property.getValueFrom(): new ExpressionModel(null, "");

        this.inputBindingFormGroup = this.formBuilder.group({
            expressionInput: [valueFrom, [CustomValidators.cwlModel]],
            position:        [property.inputBinding.position, [Validators.pattern(/^\d+$/)]],
            prefix:          [property.inputBinding.prefix],
            separate:        [property.inputBinding.separate],
            itemSeparator:   [property.inputBinding.itemSeparator]
        });

        this.listenToInputBindingFormChanges();
    }

    private listenToInputBindingFormChanges(): void {
        this.tracked = this.inputBindingFormGroup.valueChanges
            .distinctUntilChanged()
            .debounceTime(300)
            .subscribe(value => {
                if (this.inputBindingFormGroup.controls['expressionInput'].valid) {
                    this.selectedProperty.inputBinding.setValueFrom(value.expressionInput.serialize());
                } else {
                    this.selectedProperty.inputBinding.valueFrom = undefined;
                }

                this.setInputBindingProperty(this.inputBindingFormGroup, 'position', Number(value.position));
                this.setInputBindingProperty(this.inputBindingFormGroup, 'prefix', value.prefix);
                this.setInputBindingProperty(this.inputBindingFormGroup, 'separate', JSON.parse(value.separate));
                this.setInputBindingProperty(this.inputBindingFormGroup, 'itemSeparator', value.itemSeparator);

                this.propagateChange(this.selectedProperty);
            });
    }

    private setInputBindingProperty(form: FormGroup, propertyName: string, newValue: any): void {
        if (form.controls[propertyName].valid) {
            this.selectedProperty.inputBinding[propertyName] = newValue;
        } else {
            this.selectedProperty.inputBinding[propertyName] = undefined;
        }
    }

    private toggleInputBinding(hasBinding: boolean): void {
        if (!hasBinding) {
            this.selectedProperty.createInputBinding();
            this.createExpressionInputForm(this.selectedProperty);
        } else {
            this.inputBindingFormGroup = undefined;
            this.selectedProperty.removeInputBinding();
            this.propagateChange(this.selectedProperty);
        }
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
