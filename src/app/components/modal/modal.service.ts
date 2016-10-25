import {Injectable, ComponentFactoryResolver, ViewContainerRef, ComponentRef, ApplicationRef} from "@angular/core";
import {ModalComponent, ModalOptions} from "./modal.component";
import {Subject} from "rxjs";
import {ConfirmComponent} from "./common/confirm.component";

@Injectable()
export class ModalService {

    private rootViewRef: ViewContainerRef;
    private modalComponentRef: ComponentRef<ModalComponent>;

    private onClose = new Subject<any>();

    constructor(private resolver: ComponentFactoryResolver,
                private appRef: ApplicationRef) {

        // https://github.com/angular/angular/issues/9293
        this.rootViewRef = this.appRef["_changeDetectorRefs"][0]["_view"]["_appEl_0"].vcRef;

        this.onClose.subscribe(_ => {
            this.closeAndClean();
        });
    }

    public show<T>(component, options?: ModalOptions): T {

        // If some other modal is open, close it
        this.close();


        const modalFactory     = this.resolver.resolveComponentFactory(ModalComponent);
        const componentFactory = this.resolver.resolveComponentFactory(component);

        this.modalComponentRef = this.rootViewRef.createComponent(modalFactory);
        this.modalComponentRef.instance.configure<any>(options);

        const componentRef = this.modalComponentRef.instance.produce<T>(componentFactory, options.componentState || {});

        return componentRef.instance;
    }

    /**
     * Shows a confirmation modal window.
     *
     * @returns {Promise} Promise that will resolve if user confirms the prompt and reject if user cancels
     */
    public confirm(params = {
        title: "Confirm",
        content: "Are you sure?",
        confirmationLabel: "Yes",
        cancellationLabel: "Cancel"
    }): Promise<any> {

        const insideClosings = new Promise((resolve, reject) => {

            const {content, confirmationLabel, cancellationLabel} = params;

            this.show<ConfirmComponent>(ConfirmComponent, {
                title: params.title,
                componentState: {
                    content,
                    confirmationLabel,
                    cancellationLabel
                }
            }).then(componentRef => {
                const cmp = componentRef.instance;

                cmp.confirm.first().subscribe(_ => {
                    resolve(true);
                    this.close();
                });
                cmp.cancel.first().subscribe(_ => {
                    reject();
                    this.close();
                });
            });
        });

        const outsideClosings = new Promise((resolve, reject) => {
            this.onClose.first().subscribe(reject);
        });

        return Promise.race([insideClosings, outsideClosings]);
    }

    public close() {
        this.onClose.next(true);
    }

    private closeAndClean() {
        if (this.modalComponentRef) {
            this.modalComponentRef.destroy();
        }
    }
}
