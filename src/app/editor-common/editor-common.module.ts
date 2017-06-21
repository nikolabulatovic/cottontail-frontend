import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {UIModule} from "../ui/ui.module";
import {AppInfoComponent} from "./components/app-info/app-info.component";
import {BlankToolStateComponent} from "./components/blank-tool-state.component";
import {CompactListComponent} from "./components/compact-list/compact-list.component";
import {ExpressionInputComponent} from "./components/expression-input/expression-input.component";
import {ExpressionModelListComponent} from "./components/expression-model-list/expression-model-list.component";
import {KeyValueInputComponent} from "./components/key-value-component/key-value-input.component";
import {KeyValueListComponent} from "./components/key-value-component/key-value-list.component";
import {MapListComponent} from "./components/map-list/map-list.component";
import {QuickPickComponent} from "./components/quick-pick/quick-pick.component";
import {RevisionListComponent} from "./components/revision-list/revision-list.component";
import {SymbolsComponent} from "./components/symbols/symbols.component";
import {InputTypeSelectComponent} from "./components/type-select/type-select.component";
import {ValidationClassDirective} from "./components/validation-preview/validation-class.directive";
import {ValidationPreviewComponent} from "./components/validation-preview/validation-preview.component";
import {ValidationReportComponent} from "./components/validation-report/validation-report.component";
import {CwlSchemaValidationWorkerService} from "./cwl-schema-validation-worker/cwl-schema-validation-worker.service";
import {EditableDirective} from "./directives/editable.directive";
import {ExpressionEditorComponent} from "./expression-editor/expression-editor.component";
import {ModelExpressionEditorComponent} from "./expression-editor/model-expression-editor.component";
import {FileInputInspectorComponent} from "./inspector-forms/file-input-inspector.component";
import {EditorInspectorContentComponent} from "./inspector/editor-inspector-content.component";
import {EditorInspectorComponent} from "./inspector/editor-inspector.component";
import {EditorInspectorDirective} from "./inspector/editor-inspector.directive";
import {JobEditorEntryComponent} from "./job-editor/job-editor-entry.component";
import {JobEditorComponent} from "./job-editor/job-editor.component";
import {FileDefContentPipe} from "./pipes/file-def-content.pipe";
import {FileDefNamePipe} from "./pipes/file-def-name.pipe";
import {ValidationTextPipe} from "./pipes/validation-text.pipes";
import {CWLModule} from "../cwl/cwl.module";
import {EditorLayoutComponent} from "./editor-layout/editor-layout.component";
import {AppValidatorService} from "./app-validator/app-validator.service";
import {EditorPanelComponent} from "./layout/editor-panel/editor-panel.component";
import {DirectoryInputInspectorComponent} from "./inspector-forms/directory-input-inspector/directory-input-inspector.component";

@NgModule({
    declarations: [
        BlankToolStateComponent,
        CompactListComponent,
        EditableDirective,
        EditorInspectorComponent,
        EditorInspectorContentComponent,
        EditorInspectorDirective,
        ExpressionEditorComponent,
        ExpressionInputComponent,
        ExpressionModelListComponent,
        FileDefContentPipe,
        FileDefNamePipe,
        JobEditorComponent,
        JobEditorEntryComponent,
        KeyValueInputComponent,
        KeyValueListComponent,
        ModelExpressionEditorComponent,
        QuickPickComponent,
        RevisionListComponent,
        ValidationClassDirective,
        ValidationPreviewComponent,
        ValidationReportComponent,
        ValidationTextPipe,
        FileInputInspectorComponent,
        MapListComponent,
        SymbolsComponent,
        InputTypeSelectComponent,
        AppInfoComponent,
        EditorLayoutComponent,
        EditorPanelComponent,
        DirectoryInputInspectorComponent
    ],
    exports: [
        MapListComponent,
        BlankToolStateComponent,
        CompactListComponent,
        FileInputInspectorComponent,
        EditableDirective,
        EditorInspectorComponent,
        EditorInspectorContentComponent,
        EditorInspectorDirective,
        ExpressionEditorComponent,
        ExpressionInputComponent,
        ExpressionModelListComponent,
        FileDefContentPipe,
        FileDefNamePipe,
        JobEditorComponent,
        KeyValueInputComponent,
        KeyValueListComponent,
        ModelExpressionEditorComponent,
        QuickPickComponent,
        RevisionListComponent,
        ValidationClassDirective,
        ValidationPreviewComponent,
        ValidationReportComponent,
        SymbolsComponent,
        InputTypeSelectComponent,
        AppInfoComponent,
        EditorLayoutComponent
    ],
    entryComponents: [
        EditorInspectorComponent,
        EditorInspectorContentComponent,
        ExpressionEditorComponent,
        ModelExpressionEditorComponent,
    ],
    providers: [
        CwlSchemaValidationWorkerService,
        AppValidatorService,
    ],
    imports: [
        BrowserModule,
        CWLModule,
        FormsModule,
        ReactiveFormsModule,
        UIModule,
    ]
})
export class EditorCommonModule {

}
