import {Component, Input, Output} from "@angular/core";
import {Subject} from "rxjs/Subject";
@Component({
    styleUrls: ["confirm.component.scss"],
    selector: "ct-modal-confirm",
    template: `
        <form (ngSubmit)="decision.next(true)">
            <div class="body p-1">
                <span [innerHTML]="content"></span>
            </div>
            <div class="footer pr-1 pb-1">
                <button class="btn btn-secondary" (click)="decision.next(false)" type="button">{{ cancellationLabel }}</button>
                <button class="btn btn-primary" type="submit">{{ confirmationLabel }}</button>
            </div>
        </form>
    `
})
export class ConfirmComponent {

    @Input()
    public content: string;

    @Input()
    public cancellationLabel: string;

    @Input()
    public confirmationLabel: string;

    @Output()
    public decision = new Subject<boolean>();

    constructor() {

        this.content = "Are you sure?";
        this.cancellationLabel = "Cancel";
        this.confirmationLabel = "Yes";
    }
}
