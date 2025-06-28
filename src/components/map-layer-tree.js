import {LitElement, html, css, unsafeCSS} from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';
import {foldercss} from './folder-icon.css.js';
import {getCapabilitiesNodes, copyMetadataToCapsNodes} from '../utils/capabilities';
import {addLayerFromServiceIcon, filterIcon, openfileIcon} from './my-icons';
import rootUrl from '../utils/rooturl.js';
import './map-iconbutton'
import {translate as t} from '../i18n.js';

/* This component renders a tree of nodes as a collapsible tree
   leaf nodes can be selected with checkbox or radio-boxes
   Nodes are expected to be structured as follows (only group-nodes have property "subnodes"):
   [{title:"group title", opened: true|false, type: "check|radio", subnodes: []}, {title:"title2", itemid: "id"}]
*/
/**
* @polymer
* @extends HTMLElement
*/
class MapLayerTree extends LitElement {
  static get properties() { 
    return { 
      nodelist: Array,
      maplayers: Array,
      updates: Number,
      headertext: String,
      clearbtnvisible: Boolean,
      searchActive: Boolean,
      searchString: String,
      search: Boolean
    }; 
  }
  static styles = [foldercss,css`
  ul {
    list-style-type: none;
    padding-left: 10px;
    overflow: hidden;
    transition: height 0.2s ease-in-out;
    height: 0;
  }
  ul.open {
    height: auto;
  }
  li {
    cursor: pointer;
    line-height: 2.0em;
    position: relative;
  }
  li ul {
    cursor: default;
  }
  li:last-child {
    border-bottom: none;
  }
  .arrow-down {
    position: absolute;
    border-style: solid;
    border-width: 1px 1px 0 0;
    content: '';
    height: 8px;
    margin-right: 10px;
    left: auto;
    -ms-transform: rotate(45deg);
    -webkit-transform: rotate(45deg);
    transform: rotate(45deg);
    margin-top: 8px;
    vertical-align: top;
    width: 8px;
    right: 0px;
    border-color: #007BC7;;
    transition: transform .2s ease-in-out;
  }
  .opened {
    transform: rotate(133deg);
  }
  .radio-on {
    display: inline-block;
    width: 20px;
    height: 20px;
    vertical-align: middle;
    background: url('${unsafeCSS(rootUrl)}images/checkradio.png') 0 0;
  }
  .radio-off {
    display: inline-block;
    width: 20px;
    height: 20px;
    vertical-align: middle;
    background: url('${unsafeCSS(rootUrl)}images/checkradio.png') 0 20px;
  }
  .check-on {
    display: inline-block;
    width: 20px;
    height: 20px;
    vertical-align: middle;
    background: url('${unsafeCSS(rootUrl)}images/checkradio.png') 20px 20px;
  }
  .check-off {
    display: inline-block;
    width: 20px;
    height: 20px;
    vertical-align: middle;
    background: url('${unsafeCSS(rootUrl)}images/checkradio.png') 20px 0px;
  }
  .label {
    vertical-align: middle;
  }
  .title {
    font-weight: bold;
    position: relative;
    width: 100%;
    height: 30px;
    padding: 5px;
    border-bottom: 1px solid lightblue;
    box-sizing: border-box;
  }
  .wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100%  - 22px);
  }
  .layertree {
    font-size: 12px;
    overflow: auto;
    box-sizing: border-box;
    user-select: none;
    margin-right: -8px; /* compensate for padding of .panel-content */
  }
  .search {
    display: flex;
    flex-direction: row;
    border: 1px solid #E3E2E3;
    margin-top: 4px;
    width: calc(100% - 8px);
  }
  .search:hover {
    border: 1px solid #21a2ac;
  }
  .search input {
    flex-grow:1;
    border: none;
    height: 36px;
  }
  .search input:focus-visible {
    outline: none;
  }
  .searchicon {
    flex-grow:0;
    cursor: pointer;
    width: 20px;
    height: 20px;
    margin: 6px 4px;
    color: gray;
    fill: rgb(51,51,51);
  }
  .clear {
    flex-grow: 0;
    cursor: pointer;
    margin: 6px 4px;
    color: #9E9E9E;
    width: 1em;
    text-align: center;
    font-size: 1.25em;
    font-weight: 500;
    line-height: 1;
  }
  .clear.hidden {
    display: none;
  }
  .clear::before {
    content: 'x';
  }
  #edugisfile {
    display: none;
  }
  #filebutton {
    display: inline-block;
    position: absolute;
    right: 0px;
    height: 20px;
  }
  #addlayer {
    display: inline-block;
    position: absolute;
    right: 28px;
    height: 20px;
  }
  .layergroup {
    display: flex;
    align-items: center;
    cursor: default;
  }
  .leftline {
    display: inline-block;
    width: 18px;
    height: 1px;
    background-color: #999;
    margin-right: 5px; 
  }
  .rightline {
    display: inline-block;
    flex-grow: 1;
    height: 1px;
    background-color: #999;
    margin-left: 5px;
    margin-right:24px;
  }
  `]

  constructor() {
      super();
      this.nodelist = [];
      this.updates = 0;
      this.headertext = "headertext";
      this.maplayers = [];
      this.clearbtnvisible = false;
      this.searchActive = false;
      this.searchString = "";
      this.search = false;
  }
  updateChecked(nodeList, layerids)
  {
    nodeList.forEach(node=>{
      node.checked = layerids.has(node.layerInfo?node.layerInfo.id:node.id);
      if (node.sublayers) {
        this.updateChecked(node.sublayers, layerids);
      }
    });
  }
  shouldUpdate(changedProps) {
    if (changedProps.has("maplayers")) {
      const layerids = this.maplayers.reduce((result, layer)=>{
        if (layer.metadata && layer.metadata.styleid) {
          result.add(layer.metadata.styleid);
        } else {
          result.add(layer.id);
        }
        return result;
      }, new Set());
      // layerids now contains list of active map layers 
      this.updateChecked(this.nodelist, layerids)  
    }
    return true;
  }
  replaceNode(nodeList, nodeId)
  {
    const subNode = nodeList.find(node=>node.id==nodeId);
    if (subNode) {
      subNode.type = 'gettingcapabilities'; // prevent new replace while loading
      getCapabilitiesNodes(subNode.layerInfo)
        .then(newNodes=> {
          copyMetadataToCapsNodes(subNode.layerInfo, newNodes);
          for (let i = 0; i < nodeList.length; i++) {
            if (nodeList[i].id === nodeId) {
              nodeList.splice(i, 1, ...newNodes);
              //this.requestUpdate();
            }
          }
          this.requestUpdate();
        })  
        .catch(reason=>{
          subNode.title=`${nodeId}: ${reason}`;
          subNode.type='error';
          this.requestUpdate();
      });
    }
  }
  toggleOpen(e, node) {
    const list = e.currentTarget.querySelector('ul');
    const arrow = e.currentTarget.querySelector('.arrow-down');
    if (node.opened) {
      // close this list
      list.style.height = list.scrollHeight + 'px';
      arrow.classList.remove('opened');
      setTimeout(()=>list.style.height = 0, 100);
      setTimeout(()=>{
          node.opened = false;
          //list.classList.remove("open");
      }, 1000)
    } else {
      if (node.sublayers.find(node=>node.type==='getcapabilities')) {
        // sublayers has nodes of type 'getcapabilities', fetch capabilities and replace with result
        for (let i = 0; i < node.sublayers.length; i++) {
          if (node.sublayers[i].type === 'getcapabilities') {
            this.replaceNode(node.sublayers,node.sublayers[i].id);
          }
        }
      }
      // open this list
      list.style.height = 0;
      arrow.classList.add('opened');
      setTimeout(()=>list.style.height = list.scrollHeight + 'px', 100);
      setTimeout(()=>{
          list.style.height = 'auto';
          node.opened = true;
          //list.classList.add("open");
      }, 1000);
    }
    e.stopPropagation();
    //this.updates++;
  }
  isRadioNode(node) {
    if (node.type === "radio" || node.type === "reference") {
      return true;
    }
    if (node.sublayers?.length) {
      return node.sublayers.findIndex(subnode=>subnode.type === "reference") > -1;
    }
    return false;
  }
  toggleNodeInList(list, id, radio) {
    if (radio) {
      if (list.find(item=>item.id === id)) {
        list.forEach(item=>item.checked=false);
      }
    }
    list.forEach(item=>{
      if (item.id === id) {
        item.checked = !item.checked;
        this.dispatchEvent(new CustomEvent('toggleitem', 
          {detail: item}
        ));
        this.updates++;
      } else {
        if (item.sublayers) {
            this.toggleNodeInList(item.sublayers, id, this.isRadioNode(item));
        }
      }
    })
  }
  handleClick(e, node) {
    if (node.checked && this.isRadioNode(node)) {
      // should not toggle radio by clicking checked radio
      e.stopPropagation();
      return; 
    }
    const input = e.currentTarget.querySelector("div");        
    if (input) {
      const id = input.getAttribute("id");
      this.toggleNodeInList(this.nodelist, id, false);
      e.stopPropagation();
    }
  }
  ignoreClick(e) {
    e.stopPropagation();
    e.preventDefault();
  }
  renderLayerItem(nodeList, node, opened, radio, groupname) {
    if (opened && node.type === 'getcapabilities') {
      this.replaceNode(nodeList, node.id);
    }
    if (node.type === 'getcapabilities' || node.type === 'gettingcapabilities') {
      return html`<li><img src="${rootUrl}images/spinner.gif"> Loading...</li>`;
    }
    return html`<li class="data" @click="${(e)=>{this.handleClick(e, node)}}" title="${node.path?node.path:''}">
    <div class="${radio?(node.checked?'radio-on':'radio-off'):(node.checked?'check-on':'check-off')}" name="${radio?groupname:node.id}" value="${node.id}" id="${node.id}"></div>
    <span class="label">${node.title}</span></li>`;
  }
  renderTree(nodeList, opened, radio, groupname) {
    return html`
      <ul class="${opened?'open':''}">${nodeList.map(node=>{
        if (node.type === 'layergroup') {
          return html`<li @click="${e=>this.ignoreClick(e)}"><div class="layergroup"><span class="leftline"></span>${node.title}<span class="rightline"></span></div></li>`
        }
        if (node.sublayers){
          return html`<li @click="${e=>this.toggleOpen(e, node)}">
            <div class="folder-icon"><div class="folder-tab"></div><div class="folder-sheet"></div></div><div class="folder-title">${node.title}
            <span class="arrow-down${node.opened?' opened':''}"></span>
            </div>
            ${this.renderTree(node.sublayers, node.opened, this.isRadioNode(node), node.id)}</li>`
        } else {
          delete node.path;
          delete node.nodeList;
          return this.renderLayerItem(nodeList, node, opened, radio, groupname);
        }
    })}</ul>`;
  }
  render() {
    return html`
    <div class="title">${this.headertext}
      <span id="addlayer"> 
        <map-iconbutton 
          info="${ifDefined(t('lfs: layer from service')??undefined)}" 
          .icon="${addLayerFromServiceIcon}"
          @click="${(e)=>this.dispatchEvent(new Event('addExternalLayer', {}))}"
        >  
        </map-iconbutton>
      </span>
      <span id="filebutton">
        <input @change="${(e)=>this.openFile(e)}" id="edugisfile" type="file" accept=".json,.geojson,.zip,.gpx,.kml,.xls,.xlsx,.csv"/>
        <label for="edugisfile">
          <map-iconbutton info="${ifDefined(t('ltr: open file')??undefined)}" .icon="${openfileIcon}"></map-iconbutton>
        </label>
      </span>
    </div>
    <div class="wrapper">
      ${this.search?html`<div class="search"><div class="searchicon">${filterIcon}</div><input autocomplete="off" id="searchinput" spellcheck="false" type="text" placeholder="${t('find map layer')}..." @input="${(e)=>this.input(e)}"/><div class="clear ${this.clearbtnvisible?"":"hidden"}" @click="${(e)=>this.handleClearButton(e)}"></div></div>`:html``}
      <div class="layertree">
        ${this.searchActive ?
          this.renderSearch()
            :
          this.renderTree(this.nodelist, true, this.nodelist && this.nodelist.length && ((this.nodelist[0].type && this.nodelist[0].type==='reference') || (this.nodelist[1]?.type && this.nodelist[1]?.type==='reference')))
        }
      </div>
    </div>`;
  }
  async openFile(e){
    let file = e.target.files[0];
    if (!file) {
      return;
    }
    this.dispatchEvent(new CustomEvent('openedfile', {
      detail: file,
      bubbles: true,
      composed: true
    }))
  }
  searchNodeSet(searchString, nodeList, path) {
    let searchResult = [];
    for (let node of nodeList) {
      if (node.sublayers) {
        searchResult = searchResult.concat(this.searchNodeSet(searchString, node.sublayers, path.concat([node.title])));
      }
      if (node.layerInfo) {
        if ((node.title && node.title.toLowerCase().indexOf(searchString) > -1) 
          || (node.layerInfo.metadata
            && node.layerInfo.metadata.abstract
            && node.layerInfo.metadata.abstract.toLowerCase().indexOf(searchString) > -1)
          || (node.layerInfo.metadata
            && node.layerInfo.metadata.markdown
            && node.layerInfo.metadata.markdown.toLowerCase().indexOf(searchString) > -1)
          || (node.layerInfo.source 
            && node.layerInfo.source.attribution
            && node.layerInfo.source.attribution.toLowerCase().indexOf(searchString) > -1)
          || (path.length && path.join().toLowerCase().indexOf(searchString) > -1)) {
          node.nodeList = nodeList;
          node.path = path.join('=>');
          searchResult.push(node);
        }
      }
    }
    return searchResult;
  }
  renderSearch() {
    let searchString = this.searchString.toLowerCase();
    return html`
      <div class="title">zoekresultaat</div>
      <ul class="open">
        ${this.searchNodeSet(searchString, this.nodelist, []).map(node=>this.renderLayerItem(node.nodeList, node, true, false, ""))}
      </ul>
    `
  }
  input(e) {
    this.searchString = e.target.value;
    this.clearbtnvisible = this.searchString.length > 0;
    this.searchActive = (this.searchString.length > 2);
  }
  handleClearButton(e) {
    let inputElement = this.shadowRoot.querySelector('#searchinput')
    inputElement.value = "";
    inputElement.focus();
    this.searchActive = false;
    this.clearbtnvisible = false;
    this.searchString = "";
  }
}
customElements.define('map-layer-tree', MapLayerTree);
