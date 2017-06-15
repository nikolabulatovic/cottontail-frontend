import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren
} from "@angular/core";
import {FormControl} from "@angular/forms";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import {Observable} from "rxjs/Observable";
import {UserPreferencesService} from "../../../services/storage/user-preferences.service";
import {ContextService} from "../../../ui/context/context.service";
import {MenuItem} from "../../../ui/menu/menu-item";
import {ModalService} from "../../../ui/modal/modal.service";
import {TreeNode} from "../../../ui/tree-view/tree-node";
import {TreeViewComponent} from "../../../ui/tree-view/tree-view.component";
import {TreeViewService} from "../../../ui/tree-view/tree-view.service";
import {DirectiveBase} from "../../../util/directive-base/directive-base";
import {DataGatewayService} from "../../data-gateway/data-gateway.service";
import {AddSourceModalComponent} from "../../modals/add-source-modal/add-source-modal.component";
import {CreateAppModalComponent} from "../../modals/create-app-modal/create-app-modal.component";
import {CreateLocalFolderModalComponent} from "../../modals/create-local-folder-modal/create-local-folder-modal.component";
import {WorkboxService} from "../../workbox/workbox.service";
import {NavSearchResultComponent} from "../nav-search-result/nav-search-result.component";
import {MyAppsPanelService} from "./my-apps-panel.service";

@Component({
    selector: "ct-my-apps-panel",
    providers: [MyAppsPanelService],
    templateUrl: "./my-apps-panel.component.html",
    styleUrls: ["./my-apps-panel.component.scss"]
})
export class MyAppsPanelComponent extends DirectiveBase implements AfterContentInit, OnInit, AfterViewInit {

    searchContent = new FormControl();

    searchResults = undefined;

    expandedNodes: Observable<string[]>;

    rootFolders: TreeNode<any>[] = [];

    @ViewChild(TreeViewComponent)
    treeView: TreeViewComponent;

    tree: TreeViewService;

    @ViewChildren(NavSearchResultComponent, {read: ElementRef})
    private searchResultComponents: QueryList<ElementRef>;

    constructor(private preferences: UserPreferencesService,
                private cdr: ChangeDetectorRef,
                private workbox: WorkboxService,
                private modal: ModalService,
                private dataGateway: DataGatewayService,
                private service: MyAppsPanelService,
                private context: ContextService) {
        super();

    }

    ngOnInit(): void {
    }

    ngAfterContentInit() {
        this.tree = this.treeView.getService();

        this.attachSearchObserver();

        this.attachExpansionStateSaving();
        this.listenForAppOpening();
        this.listenForContextMenu();

        this.service.rootFolders.subscribe(folders => {
            this.rootFolders = folders;
        });

    }

    ngAfterViewInit() {
        this.searchResultComponents.changes.subscribe(list => {
            list.forEach((el, idx) => setTimeout(() => el.nativeElement.classList.add("shown"), idx * 20));
        });
    }

    openAddAppSourcesDialog() {
        this.modal.fromComponent(AddSourceModalComponent, {
            title: "Open a Project",
            backdrop: true
        });
    }

    openSearchResult(entry: { id: string }) {
        this.workbox.getOrCreateFileTab(entry.id)
            .take(1)
            .subscribe(tab => this.workbox.openTab(tab));
    }

    private attachSearchObserver() {

        const localFileSearch = (term) => this.dataGateway.searchLocalProjects(term).map(results => results.map(result => {

            const id    = result.path;
            const label = result.path.split("/").slice(-3, -1).join("/");
            const title = result.path.split("/").pop();

            let icon      = "fa-file";
            let relevance = result.relevance;

            if (result.type === "Workflow") {
                icon = "fa-share-alt";
                relevance++;
            } else if (result.type === "CommandLineTool") {
                icon = "fa-terminal";
                relevance++;
            }

            return {
                id, icon, title, label, relevance,
                dragEnabled: ["Workflow", "CommandLineTool"].indexOf(result.type) !== -1,
                dragTransferData: id,
                dragLabel: title,
                dragImageClass: result.type === "CommandLineTool" ? "icon-command-line-tool" : "icon-workflow",
                dragDropZones: ["zone1"]
            };
        }));


        const projectSearch = (term) => this.dataGateway.searchUserProjects(term)
            .map(resultGroups => {
                return resultGroups.map(group => {

                    const {results, hash} = group;

                    return results.map(result => {
                        const id    = hash + "/" + result["owner"] + "/" + result["slug"] + "/" + result["sbg:id"];
                        const title = result.label;

                        return {
                            id,
                            icon: result.class === "Workflow" ? "fa-share-alt" : "fa-terminal",
                            title,
                            label: result.id.split("/").slice(5, 7).join(" → "),
                            relevance: 1.5,

                            dragEnabled: true,
                            dragTransferData: id,
                            dragLabel: title,
                            dragImageClass: result["class"] === "CommandLineTool" ? "icon-command-line-tool" : "icon-workflow",
                            dragDropZones: ["zone1"]
                        };
                    });

                }).reduce((acc, item) => acc.concat(...item), []);
            });

        this.searchContent.valueChanges
            .do(term => this.searchResults = undefined)
            .debounceTime(250)
            .distinctUntilChanged()
            .filter(term => term.trim().length !== 0)
            .flatMap(term => Observable.zip(localFileSearch(term), projectSearch(term)))
            .subscribe(datasets => {
                const combined     = [].concat(...datasets).sort((a, b) => b.relevance - a.relevance);
                this.searchResults = combined;
                this.cdr.markForCheck();
            });
    }

    /**
     * Attaches an expansion state listener to the tree and dispatches state updates to
     * a service for saving.
     */
    private attachExpansionStateSaving(): void {

        this.tree.expansionChanges.subscribe(node => {

            const state = node.getExpansionState();

            if (node.id === "local" || node.type === "folder") {
                return this.service.updateLocalNodeExpansionState(node.id, state);
            }

            this.service.updatePlatformNodeExpansionState(node.id, state);
        });
    }

    private listenForAppOpening() {
        this.tree.open.filter(n => n.type === "app").subscribe(node => {
            console.log("Creating a tab for node", node);
            const appID = node.data.id.split("/").slice(0,3).join("/");
            const label = node.data.name;
            const type = node.data.raw.class === "CommandLineTool" ? "CommandLineTool" : "Workflow";

            const tab = this.workbox.getOrCreateAppTab({
                id: appID,
                type: type,
                label: label,
                isWritable: true,
                language: "json",
            });

            this.workbox.openTab(tab);
        });

        this.tree.open.filter(n => n.type === "file")
            .flatMap(node => this.workbox.getOrCreateFileTab(node.data.path).catch(() => {
                return Observable.empty();
            }))
            .subscribe(tab => this.workbox.openTab(tab));
    }

    private listenForContextMenu() {


        // Platform root
        this.tree.contextMenu
            .filter(data => data.node.type === "source" && data.node.id !== "local")
            .subscribe((data) => {
                this.context.showAt(data.node.getViewContainer(), [
                    new MenuItem("Refresh data", {
                        click: () => this.service.reloadPlatformData()
                    })
                ], data.coordinates);
            });

        // When click on user project
        this.tree.contextMenu.filter((data) => data.node.type === "project")
            .subscribe(data => {
                const contextMenu = [
                    new MenuItem("Create new Workflow", {
                        click: () => {
                            const modal = this.modal.fromComponent(CreateAppModalComponent, {
                                closeOnOutsideClick: false,
                                backdrop: true,
                                title: `Create a new Workflow in "${data.node.label}"`,
                                closeOnEscape: true
                            });

                            modal.appType        = "workflow";
                            modal.destination    = "remote";
                            modal.defaultProject = data.node.id;
                        }
                    }),
                    new MenuItem("Create new Command Line Tool", {
                        click: () => {
                            const modal = this.modal.fromComponent(CreateAppModalComponent, {
                                closeOnOutsideClick: false,
                                backdrop: true,
                                title: `Create a new Command Line Tool in "${data.node.label}"`,
                                closeOnEscape: true
                            });

                            modal.appType        = "tool";
                            modal.destination    = "remote";
                            modal.defaultProject = data.node.id;
                        }
                    }),
                    new MenuItem("Remove from Workspace", {
                        click: () => {
                            this.preferences.get("openProjects", []).take(1).subscribe(openProjects => {

                                this.preferences.put("openProjects", openProjects.filter((el) => el !== data.node.id));
                            });
                        }
                    })
                ];
                this.context.showAt(data.node.getViewContainer(), contextMenu, data.coordinates);
            });

        // When click on some root local folder
        this.tree.contextMenu.filter((data) => data.node.type === "folder" && data.node.level === 2)
            .subscribe(data => {
                const contextMenu = [
                    new MenuItem("Create new Folder", {
                        click: () => {
                            const modal = this.modal.fromComponent(CreateLocalFolderModalComponent, {
                                closeOnOutsideClick: false,
                                backdrop: true,
                                title: `Create a new Folder in "${data.node.label}"`,
                                closeOnEscape: true
                            });

                            modal.folderPath = data.node.id;
                        }
                    }),
                    new MenuItem("Create new Workflow", {
                        click: () => {
                            const modal = this.modal.fromComponent(CreateAppModalComponent, {
                                closeOnOutsideClick: false,
                                backdrop: true,
                                title: `Create a new Workflow in "${data.node.label}"`,
                                closeOnEscape: true
                            });

                            modal.appType       = "workflow";
                            modal.defaultFolder = data.node.id + "/";
                        }
                    }),
                    new MenuItem("Create new Command Line Tool", {
                        click: () => {
                            const modal = this.modal.fromComponent(CreateAppModalComponent, {
                                closeOnOutsideClick: false,
                                backdrop: true,
                                title: `Create a new Command Line Tool in "${data.node.label}"`,
                                closeOnEscape: true
                            });

                            modal.appType       = "tool";
                            modal.defaultFolder = data.node.id + "/";
                        }
                    }),
                    new MenuItem("Remove from Workspace", {
                        click: () => {
                            this.preferences.get("localFolders", []).take(1).subscribe(openFolders => {

                                this.preferences.put("localFolders", openFolders.filter((el) => el !== data.node.id));
                            });
                        }
                    })
                ];

                this.context.showAt(data.node.getViewContainer(), contextMenu, data.coordinates);
            });
    }
}
