
var fs = require('fs');
import path = require('path');
import * as vscode from 'vscode';
import { Base64 } from 'js-base64';
import  dgml from 'ts-dgml';

import { Config, DgmlParser, FileSystemUtils } from '@src';
import { IDirectedGraph } from '@model';

export class DgmlViewer {

  private static readonly _name: string = 'dgmlViewer';
  private extensionContext: vscode.ExtensionContext;
  private config = new Config();
  private fsUtils = new FileSystemUtils();
  private directedGraph: IDirectedGraph | string | undefined;
  private zoom: number = 1.25;
  public static get commandName(): string { return DgmlViewer._name; }

  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
  }

  public execute(webview: vscode.Webview): void {

    webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'saveAsPng': {
            this.saveAs(message.text, `${this.config.dgmlViewerSaveAsFilename}.png`);
            return;
          }
          case 'saveAsJpg': {
            this.saveAs(message.text, `${this.config.dgmlViewerSaveAsFilename}.jpg`);
            return;
          }
          case 'saveAsSvg': {
            this.saveAs(message.text, `${this.config.dgmlViewerSaveAsFilename}.svg`, true);
            return;
          }
          case 'saveAsJson': {
            this.saveAs(message.text, `${this.config.dgmlViewerSaveAsFilename}.json`, true);
            return;
          }
          case 'openFile': {
            const filename = message.text;
            if (this.fsUtils.fileExists(filename)) {
              var openPath = vscode.Uri.parse("file:///" + filename);
              vscode.workspace.openTextDocument(openPath).then(doc => {
                vscode.window.showTextDocument(doc);
              });
            }
            return;
          }
          case 'nodeCoordinateUpdate': {
            if (this.directedGraph !== undefined && typeof this.directedGraph !== 'string') {
              const node = this.directedGraph.nodes.find(node => node.id === message.text.nodeId);
              if (node !== undefined) {
                node.boundsX = message.text.position.x;
                node.boundsY = message.text.position.y;
                node.boundsWidth = message.text.width;
                node.boundsHeight = message.text.height;
                this.generateAndWriteJavascriptFile(() => { });
              }
            }
            return;
          }
          case 'zoom': {
            this.zoom = message.text;
            this.generateAndWriteJavascriptFile(() => { });
            return;
          }
        }
      },
      undefined,
      this.extensionContext.subscriptions
    );

    var graph = new dgml.DirectedGraph();
    var node1 = new dgml.Node("com.huawei.MyClass:test1", "MyClass:test1");
    node1.moreProps =  { Background: 'Red' };
    graph.nodes.push(node1);
    graph.nodes.push(new dgml.Node("com.huawei.MyClass:test2", "MyClass:test2"));
    graph.nodes.push(new dgml.Node("java.lang.Runtime:exec", "Runtime:exec"));
    graph.links.push(new dgml.Link("com.huawei.MyClass:test1", "com.huawei.MyClass:test2"));
    var ling2 = new dgml.Link("com.huawei.MyClass:test2", "java.lang.Runtime:exec");
    ling2.moreProps = { 'Linenum': '10' };
    graph.links.push(ling2);
    var ds = new dgml.nodeXml.Serializer(graph, {
      indent: true, declaration: true
    });
    console.log(ds.toDgml());
    const dgmlParser = new DgmlParser();
    var myxml = `
    <?xml version="1.0" encoding="UTF-8"?>
<DirectedGraph xmlns="http://schemas.microsoft.com/vs/2009/dgml">
    <Nodes>
        <Node Id="com.gcf.MyClass:test1" Label="MyClass:test1"/>
        <Node Id="com.gcf.MyClass:test2" Label="MyClass:test2"/>
        <Node Id="java.lang.Runtime:exec" Label="Runtime:exec" Background="Red"/>
    </Nodes>
    <Links>
        <Link Source="com.gcf.MyClass:test1" Target="com.gcf.MyClass:test2" LineNum="15" Label="xxx"/>
        <Link Source="com.gcf.MyClass:test2" Target="java.lang.Runtime:exec" LineNum="21"/>
    </Links>
    <Categories>
    </Categories>  
</DirectedGraph>`;
let data = `{
  "method_hash": "Z4lMSWOI60SP_uKDAewipg#031",
  "method_full": "test.call_graph.method_call.TestMCCaller:test1a()",
  "children": [
    {
      "method_hash": "SP_MOiuKbyMirmBMygzpGw#040",
      "method_full": "test.call_graph.method_call.TestMCCallee:test1(java.lang.String)",
      "lineNum": 20
    },
    {
      "method_hash": "SP_MOiuKbyMirmBMygzpGw#040",
      "method_full": "test.call_graph.method_call.TestMCCallee:test1(java.lang.String)",
      "lineNum": 21
    }
  ]
}`

let data2 = `{
  "method_hash": "7DjbtcSxeK7OKIUZ9SCcHg#091",
  "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:initialize(org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
  "children": [
      {
          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
          "method_full": "java.util.Date:<init>()",
          "lineNum": 67
      },
      {
          "method_hash": "rJkTIWkkUpaMtD-HUIf4pw#04f",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getFileTime()",
          "lineNum": 68
      },
      {
          "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
          "method_full": "java.util.Date:<init>(long)",
          "lineNum": 68
      },
      {
          "method_hash": "IYT126XB_FarCFspnnqaMA#051",
          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
          "lineNum": 68,
          "children": [
              {
                  "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                  "lineNum": 1616,
                  "children": [
                      {
                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                          "lineNum": 1593,
                          "children": [
                              {
                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                  "method_full": "java.util.TimeZone:getDefault()",
                                  "lineNum": 360
                              }
                          ]
                      },
                      {
                          "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                          "lineNum": 1602,
                          "children": [
                              {
                                  "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                  "lineNum": 1621
                              },
                              {
                                  "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                  "lineNum": 1626
                              },
                              {
                                  "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                  "lineNum": 1631
                              }
                          ]
                      },
                      {
                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                          "method_full": "java.util.Date:getTime()",
                          "lineNum": 1605
                      },
                      {
                          "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                          "method_full": "java.util.Date:<init>(long)",
                          "lineNum": 1605
                      },
                      {
                          "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                          "lineNum": 1606,
                          "children": [
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1181,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                  "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                  "lineNum": 1181
                              },
                              {
                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                  "method_full": "java.util.Date:getTime()",
                                  "lineNum": 1185
                              },
                              {
                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                  "method_full": "java.util.Date:<init>(long)",
                                  "lineNum": 1185
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1203
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1204
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1218
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1220
                              },
                              {
                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                  "lineNum": 1228
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1239
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1241
                              },
                              {
                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                  "lineNum": 1250
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1270,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1283,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1286,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1294,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                  "method_full": "java.util.Date:before(java.util.Date)",
                                  "lineNum": 1313
                              },
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1322,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1330,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                  "method_full": "java.util.Date:before(java.util.Date)",
                                  "lineNum": 1350
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1354
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1356
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1358,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1392,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1448,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1471
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1472
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1483,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                  "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                  "lineNum": 1506
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1525
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1527
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1552
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1554
                              }
                          ]
                      },
                      {
                          "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                          "method_full": "java.util.Date:before(java.util.Date)",
                          "lineNum": 1607
                      },
                      {
                          "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                          "method_full": "java.util.Date:compareTo(java.util.Date)",
                          "lineNum": 1611
                      }
                  ]
              }
          ]
      },
      {
          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
          "method_full": "java.util.Date:<init>()",
          "lineNum": 69
      },
      {
          "method_hash": "IYT126XB_FarCFspnnqaMA#051",
          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
          "lineNum": 69,
          "children": [
              {
                  "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                  "lineNum": 1616,
                  "children": [
                      {
                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                          "lineNum": 1593,
                          "children": [
                              {
                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                  "method_full": "java.util.TimeZone:getDefault()",
                                  "lineNum": 360
                              }
                          ]
                      },
                      {
                          "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                          "lineNum": 1602,
                          "children": [
                              {
                                  "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                  "lineNum": 1621
                              },
                              {
                                  "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                  "lineNum": 1626
                              },
                              {
                                  "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                  "lineNum": 1631
                              }
                          ]
                      },
                      {
                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                          "method_full": "java.util.Date:getTime()",
                          "lineNum": 1605
                      },
                      {
                          "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                          "method_full": "java.util.Date:<init>(long)",
                          "lineNum": 1605
                      },
                      {
                          "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                          "lineNum": 1606,
                          "children": [
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1181,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                  "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                  "lineNum": 1181
                              },
                              {
                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                  "method_full": "java.util.Date:getTime()",
                                  "lineNum": 1185
                              },
                              {
                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                  "method_full": "java.util.Date:<init>(long)",
                                  "lineNum": 1185
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1203
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1204
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1218
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1220
                              },
                              {
                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                  "lineNum": 1228
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1239
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1241
                              },
                              {
                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                  "lineNum": 1250
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1270,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1283,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1286,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1294,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                  "method_full": "java.util.Date:before(java.util.Date)",
                                  "lineNum": 1313
                              },
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1322,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1330,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                  "method_full": "java.util.Date:before(java.util.Date)",
                                  "lineNum": 1350
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1354
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1356
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1358,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1392,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1448,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1471
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1472
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1483,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                  "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                  "lineNum": 1506
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1525
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1527
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1552
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1554
                              }
                          ]
                      },
                      {
                          "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                          "method_full": "java.util.Date:before(java.util.Date)",
                          "lineNum": 1607
                      },
                      {
                          "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                          "method_full": "java.util.Date:compareTo(java.util.Date)",
                          "lineNum": 1611
                      }
                  ]
              }
          ]
      },
      {
          "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
          "lineNum": 70
      },
      {
          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
          "method_full": "java.util.Date:getTime()",
          "lineNum": 70
      },
      {
          "method_hash": "_aSSFev0lN8qJ2mHjSRnPw#058",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setCurrentFileTime(long)",
          "lineNum": 70
      },
      {
          "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
          "lineNum": 71
      },
      {
          "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
          "lineNum": 72
      },
      {
          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
          "method_full": "java.util.Date:getTime()",
          "lineNum": 72
      },
      {
          "method_hash": "Pd4jXDnoGS52ypFlKhyfdw#055",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setPrevFileTime(long)",
          "lineNum": 72,
          "children": [
              {
                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                  "method_full": "java.util.Date:<init>(long)",
                  "lineNum": 130
              },
              {
                  "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                  "lineNum": 130
              }
          ]
      },
      {
          "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
          "lineNum": 73
      },
      {
          "method_hash": "N59e7ic2pw_AkVDi5S6L1w#055",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setTimeBased(boolean)",
          "lineNum": 73
      },
      {
          "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
          "method_full": "java.util.Date:before(java.util.Date)",
          "lineNum": 75
      },
      {
          "method_hash": "YI2B90T3SoTSRrgivb3JWg#04e",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:rollover()",
          "lineNum": 77,
          "children": [
              {
                  "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                  "method_full": "java.util.Date:<init>()",
                  "lineNum": 149
              },
              {
                  "method_hash": "IYT126XB_FarCFspnnqaMA#051",
                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
                  "lineNum": 149,
                  "children": [
                      {
                          "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                          "lineNum": 1616,
                          "children": [
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1593,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                                  "lineNum": 1602,
                                  "children": [
                                      {
                                          "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                          "lineNum": 1621
                                      },
                                      {
                                          "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                          "lineNum": 1626
                                      },
                                      {
                                          "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                          "lineNum": 1631
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                  "method_full": "java.util.Date:getTime()",
                                  "lineNum": 1605
                              },
                              {
                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                  "method_full": "java.util.Date:<init>(long)",
                                  "lineNum": 1605
                              },
                              {
                                  "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                  "lineNum": 1606,
                                  "children": [
                                      {
                                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                          "lineNum": 1181,
                                          "children": [
                                              {
                                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                  "method_full": "java.util.TimeZone:getDefault()",
                                                  "lineNum": 360
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                          "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                          "lineNum": 1181
                                      },
                                      {
                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                          "method_full": "java.util.Date:getTime()",
                                          "lineNum": 1185
                                      },
                                      {
                                          "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                          "method_full": "java.util.Date:<init>(long)",
                                          "lineNum": 1185
                                      },
                                      {
                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                          "method_full": "java.util.SortedSet:size()",
                                          "lineNum": 1203
                                      },
                                      {
                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                          "method_full": "java.util.SortedSet:first()",
                                          "lineNum": 1204
                                      },
                                      {
                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                          "method_full": "java.util.SortedSet:size()",
                                          "lineNum": 1218
                                      },
                                      {
                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                          "method_full": "java.util.SortedSet:first()",
                                          "lineNum": 1220
                                      },
                                      {
                                          "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                          "lineNum": 1228
                                      },
                                      {
                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                          "method_full": "java.util.SortedSet:size()",
                                          "lineNum": 1239
                                      },
                                      {
                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                          "method_full": "java.util.SortedSet:first()",
                                          "lineNum": 1241
                                      },
                                      {
                                          "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                          "lineNum": 1250
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1270,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1283,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                          "lineNum": 1286,
                                          "children": [
                                              {
                                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                  "method_full": "java.util.TimeZone:getDefault()",
                                                  "lineNum": 360
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1294,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                          "method_full": "java.util.Date:before(java.util.Date)",
                                          "lineNum": 1313
                                      },
                                      {
                                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                          "lineNum": 1322,
                                          "children": [
                                              {
                                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                  "method_full": "java.util.TimeZone:getDefault()",
                                                  "lineNum": 360
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1330,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                          "method_full": "java.util.Date:before(java.util.Date)",
                                          "lineNum": 1350
                                      },
                                      {
                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                          "method_full": "java.util.SortedSet:size()",
                                          "lineNum": 1354
                                      },
                                      {
                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                          "method_full": "java.util.SortedSet:first()",
                                          "lineNum": 1356
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1358,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1392,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1448,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                          "method_full": "java.util.SortedSet:size()",
                                          "lineNum": 1471
                                      },
                                      {
                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                          "method_full": "java.util.SortedSet:first()",
                                          "lineNum": 1472
                                      },
                                      {
                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                          "lineNum": 1483,
                                          "children": [
                                              {
                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                  "lineNum": 1676
                                              },
                                              {
                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                  "lineNum": 1698
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                          "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                          "lineNum": 1506
                                      },
                                      {
                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                          "method_full": "java.util.SortedSet:size()",
                                          "lineNum": 1525
                                      },
                                      {
                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                          "method_full": "java.util.SortedSet:first()",
                                          "lineNum": 1527
                                      },
                                      {
                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                          "method_full": "java.util.SortedSet:size()",
                                          "lineNum": 1552
                                      },
                                      {
                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                          "method_full": "java.util.SortedSet:first()",
                                          "lineNum": 1554
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                  "method_full": "java.util.Date:before(java.util.Date)",
                                  "lineNum": 1607
                              },
                              {
                                  "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                                  "method_full": "java.util.Date:compareTo(java.util.Date)",
                                  "lineNum": 1611
                              }
                          ]
                      }
                  ]
              },
              {
                  "method_hash": "2-oiwc2UGpH9GvTVT4LZGg#069",
                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(java.util.Date,java.util.Date)",
                  "lineNum": 149,
                  "children": [
                      {
                          "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                          "lineNum": 365
                      },
                      {
                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                          "method_full": "java.util.Date:getTime()",
                          "lineNum": 365
                      },
                      {
                          "method_hash": "Pd4jXDnoGS52ypFlKhyfdw#055",
                          "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setPrevFileTime(long)",
                          "lineNum": 365,
                          "children": [
                              {
                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                  "method_full": "java.util.Date:<init>(long)",
                                  "lineNum": 130
                              },
                              {
                                  "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                  "lineNum": 130
                              }
                          ]
                      },
                      {
                          "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                          "lineNum": 366
                      },
                      {
                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                          "method_full": "java.util.Date:getTime()",
                          "lineNum": 366
                      },
                      {
                          "method_hash": "_aSSFev0lN8qJ2mHjSRnPw#058",
                          "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setCurrentFileTime(long)",
                          "lineNum": 366
                      },
                      {
                          "method_hash": "yEK9OH_vMu2UitWu13C0UA#04c",
                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover()",
                          "lineNum": 367,
                          "children": [
                              {
                                  "method_hash": "22fB1RUA3ApXNcv9n1HV8Q#053",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:hasOutputStream()",
                                  "lineNum": 371
                              },
                              {
                                  "method_hash": "BvVWLsTDU5RcjdOW-PGbfA#054",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isCreateOnDemand()",
                                  "lineNum": 371,
                                  "children": [
                                      {
                                          "method_hash": "7ohN_DEounvTU1s1UrEQNw#045",
                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:isCreateOnDemand()",
                                          "lineNum": 0
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "hvjVivV82nkf7x_ZUrEplw#051",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isDirectWrite()",
                                  "lineNum": 371
                              },
                              {
                                  "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                  "lineNum": 375
                              },
                              {
                                  "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                  "lineNum": 376
                              },
                              {
                                  "method_hash": "T6eyAlcOOXnt7c4jBsO7Og#063",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverTriggered(java.lang.String)",
                                  "lineNum": 378
                              },
                              {
                                  "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                  "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                  "lineNum": 380
                              },
                              {
                                  "method_hash": "r45QCSKe6mKx0tjYqG5dZQ#01e",
                                  "method_full": "java.lang.Thread:interrupted()",
                                  "lineNum": 386
                              },
                              {
                                  "method_hash": "9AOFgj6cjqniC2_1VW6jGQ#036",
                                  "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String)",
                                  "lineNum": 389
                              },
                              {
                                  "method_hash": "6Vb11-rGm8zCk6l3sSladQ#08b",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(org.apache.logging.log4j.core.appender.rolling.RolloverStrategy)",
                                  "lineNum": 392,
                                  "children": [
                                      {
                                          "method_hash": "QNFPuXg6R-1kHuwbiT2oGQ#028",
                                          "method_full": "java.util.concurrent.Semaphore:acquire()",
                                          "lineNum": 492
                                      },
                                      {
                                          "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                          "lineNum": 495
                                      },
                                      {
                                          "method_hash": "02pC5aI3pVadW5t6FJG2jA#08b",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverStrategy:rollover(org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                          "lineNum": 502
                                      },
                                      {
                                          "method_hash": "xz9uxGWYYDRcxnnc-ldQZA#04f",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:writeFooter()",
                                          "lineNum": 504
                                      },
                                      {
                                          "method_hash": "R1Ciu543VORoW7D4n0-37Q#055",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:closeOutputStream()",
                                          "lineNum": 505
                                      },
                                      {
                                          "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                          "lineNum": 506,
                                          "children": [
                                              {
                                                  "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                  "lineNum": 0
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                          "lineNum": 507,
                                          "children": [
                                              {
                                                  "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                  "lineNum": 0
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                          "lineNum": 507
                                      },
                                      {
                                          "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                          "lineNum": 509,
                                          "children": [
                                              {
                                                  "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                  "lineNum": 0
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "xC6DufXbTNEVUIsJ4uOkDA#046",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.action.Action:execute()",
                                          "lineNum": 509
                                      },
                                      {
                                          "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                          "lineNum": 512
                                      },
                                      {
                                          "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                          "lineNum": 516,
                                          "children": [
                                              {
                                                  "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                  "lineNum": 0
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                          "lineNum": 517,
                                          "children": [
                                              {
                                                  "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                  "lineNum": 0
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                          "lineNum": 517
                                      },
                                      {
                                          "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                          "lineNum": 518,
                                          "children": [
                                              {
                                                  "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                  "lineNum": 0
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "n8fdAnY0OWxG7IDXCzMHUg#0d4",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager$AsyncAction:<init>(org.apache.logging.log4j.core.appender.rolling.action.Action,org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                          "lineNum": 518,
                                          "children": [
                                              {
                                                  "method_hash": "zSCDY7xBHieHlFNQCyWJvQ#04d",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.action.AbstractAction:<init>()",
                                                  "lineNum": 545
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "zTsT_sEXWAqLn-yIjM0VyA#040",
                                          "method_full": "java.util.concurrent.ExecutorService:execute(java.lang.Runnable)",
                                          "lineNum": 518
                                      },
                                      {
                                          "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                          "method_full": "java.util.concurrent.Semaphore:release()",
                                          "lineNum": 526
                                      },
                                      {
                                          "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                          "method_full": "java.util.concurrent.Semaphore:release()",
                                          "lineNum": 526
                                      },
                                      {
                                          "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                          "method_full": "java.util.concurrent.Semaphore:release()",
                                          "lineNum": 526
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                  "method_full": "java.lang.System:currentTimeMillis()",
                                  "lineNum": 395
                              },
                              {
                                  "method_hash": "nv9gbzB7gdOlPgkYR1-d1A#05b",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createFileAfterRollover()",
                                  "lineNum": 396,
                                  "children": [
                                      {
                                          "method_hash": "yqOGdtCv9LlO2pyzHfPBJg#056",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createOutputStream()",
                                          "lineNum": 419,
                                          "children": [
                                              {
                                                  "method_hash": "04hWR-wNgeVlAbTaX413iQ#047",
                                                  "method_full": "org.apache.logging.log4j.core.appender.FileManager:createOutputStream()",
                                                  "lineNum": 0,
                                                  "children": [
                                                      {
                                                          "method_hash": "kUUtyE-yshpkrlLF8CizJQ#040",
                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:getFileName()",
                                                          "lineNum": 188,
                                                          "children": [
                                                              {
                                                                  "method_hash": "AjqeyG3azkKFvR0N-tS_ww#03c",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.FileManager:getName()",
                                                                  "lineNum": 286,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "rG7hUyPbbfhJR24G1aun9g#044",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:getName()",
                                                                          "lineNum": 0,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      }
                                                                  ]
                                                              }
                                                          ]
                                                      },
                                                      {
                                                          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                                          "method_full": "java.util.Date:<init>()",
                                                          "lineNum": 189
                                                      },
                                                      {
                                                          "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                          "lineNum": 189
                                                      },
                                                      {
                                                          "method_hash": "bVcWvqzqttgH8z2t2R8_UA#025",
                                                          "method_full": "java.io.File:<init>(java.lang.String)",
                                                          "lineNum": 190
                                                      },
                                                      {
                                                          "method_hash": "dO6Tsyiv9mWcpx5mclu1hw#050",
                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:createParentDir(java.io.File)",
                                                          "lineNum": 191
                                                      },
                                                      {
                                                          "method_hash": "Vcg5W6E6Et4xchwVhfV3Aw#035",
                                                          "method_full": "java.io.FileOutputStream:<init>(java.io.File,boolean)",
                                                          "lineNum": 192
                                                      },
                                                      {
                                                          "method_hash": "h5sUwZofbSPjw3FsIyNmuw#015",
                                                          "method_full": "java.io.File:exists()",
                                                          "lineNum": 193
                                                      },
                                                      {
                                                          "method_hash": "jEwGDKaNxrqlr_Fu5LBEGg#015",
                                                          "method_full": "java.io.File:length()",
                                                          "lineNum": 193
                                                      },
                                                      {
                                                          "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                                          "method_full": "java.lang.System:currentTimeMillis()",
                                                          "lineNum": 195
                                                      },
                                                      {
                                                          "method_hash": "XTRqcn8pEc_W7IDattsO4A#031",
                                                          "method_full": "java.nio.file.attribute.FileTime:fromMillis(long)",
                                                          "lineNum": 195
                                                      },
                                                      {
                                                          "method_hash": "0qQVGMvv1qmA4ZkhtzHmzQ#015",
                                                          "method_full": "java.io.File:toPath()",
                                                          "lineNum": 196
                                                      },
                                                      {
                                                          "method_hash": "frQm5mNTus-YYezDKI4BrA#071",
                                                          "method_full": "java.nio.file.Files:setAttribute(java.nio.file.Path,java.lang.String,java.lang.Object,java.nio.file.LinkOption[])",
                                                          "lineNum": 196
                                                      },
                                                      {
                                                          "method_hash": "zTk20a5at3-bP7-ZuCovDw#047",
                                                          "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object)",
                                                          "lineNum": 198
                                                      },
                                                      {
                                                          "method_hash": "rX3OlAkJ11jSH_NiV_ryMQ#054",
                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:writeHeader(java.io.OutputStream)",
                                                          "lineNum": 200,
                                                          "children": [
                                                              {
                                                                  "method_hash": "HxZd6k-iTe3nt1fJyIbtfA#05c",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:writeHeader(java.io.OutputStream)",
                                                                  "lineNum": 0,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "8o28hTGaDSpneaWxiHyQbA#030",
                                                                          "method_full": "org.apache.logging.log4j.core.Layout:getHeader()",
                                                                          "lineNum": 127,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "Zolp049DcmF04lVMNA_Hmw#03f",
                                                                                  "method_full": "org.apache.logging.log4j.core.layout.AbstractLayout:getHeader()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "Pew9p1cKFRIdw-TF-2HLRw#02a",
                                                                          "method_full": "java.io.OutputStream:write(byte[],int,int)",
                                                                          "lineNum": 130
                                                                      },
                                                                      {
                                                                          "method_hash": "vIpY5gly7pSa9E-OUOebtA#069",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:logError(java.lang.String,java.lang.Throwable)",
                                                                          "lineNum": 132,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "-p4pq5TXjyh1ivdMMKEeXw#065",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:logError(java.lang.String,java.lang.Throwable)",
                                                                                  "lineNum": 0,
                                                                                  "children": [
                                                                                      {
                                                                                          "method_hash": "WeZJT46eBnjyxwyc89RvrA#07f",
                                                                                          "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:log(org.apache.logging.log4j.Level,java.lang.String,java.lang.Throwable)",
                                                                                          "lineNum": 243,
                                                                                          "children": [
                                                                                              {
                                                                                                  "method_hash": "k9RmyBKtgxgjYHxQbALiow#033",
                                                                                                  "method_full": "org.apache.logging.log4j.Logger:getMessageFactory()",
                                                                                                  "lineNum": 233
                                                                                              },
                                                                                              {
                                                                                                  "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                                  "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                                  "lineNum": 234
                                                                                              },
                                                                                              {
                                                                                                  "method_hash": "FrMlsynGLAVgglkclwZW5Q#05f",
                                                                                                  "method_full": "org.apache.logging.log4j.message.MessageFactory:newMessage(java.lang.String,java.lang.Object[])",
                                                                                                  "lineNum": 233
                                                                                              },
                                                                                              {
                                                                                                  "method_hash": "ssQL2kR6f7fV2aYFpu0JBQ#080",
                                                                                                  "method_full": "org.apache.logging.log4j.Logger:log(org.apache.logging.log4j.Level,org.apache.logging.log4j.message.Message,java.lang.Throwable)",
                                                                                                  "lineNum": 235
                                                                                              }
                                                                                          ]
                                                                                      }
                                                                                  ]
                                                                              }
                                                                          ]
                                                                      }
                                                                  ]
                                                              }
                                                          ]
                                                      },
                                                      {
                                                          "method_hash": "V1UxhLaycijayebyEX29QQ#03c",
                                                          "method_full": "java.nio.file.Paths:get(java.lang.String,java.lang.String[])",
                                                          "lineNum": 202
                                                      },
                                                      {
                                                          "method_hash": "v7hcG_w3P185cHZn9H4zaw#05a",
                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:defineAttributeView(java.nio.file.Path)",
                                                          "lineNum": 202,
                                                          "children": [
                                                              {
                                                                  "method_hash": "dJ-R_QAcjdry6NhECWPloQ#01b",
                                                                  "method_full": "java.nio.file.Path:toFile()",
                                                                  "lineNum": 213
                                                              },
                                                              {
                                                                  "method_hash": "kb_oR9deZH3YU2zLFbGHag#01c",
                                                                  "method_full": "java.io.File:createNewFile()",
                                                                  "lineNum": 213
                                                              },
                                                              {
                                                                  "method_hash": "jqL9hd_q_9uyCT2VIpT6ig#08d",
                                                                  "method_full": "org.apache.logging.log4j.core.util.FileUtils:defineFilePosixAttributeView(java.nio.file.Path,java.util.Set,java.lang.String,java.lang.String)",
                                                                  "lineNum": 215,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "JxFEWpwCG5b9mrXZxE1N3Q#067",
                                                                          "method_full": "java.nio.file.Files:getFileAttributeView(java.nio.file.Path,java.lang.Class,java.nio.file.LinkOption[])",
                                                                          "lineNum": 154
                                                                      },
                                                                      {
                                                                          "method_hash": "Ae1bRXNtUA_XChmiVWvpbw#026",
                                                                          "method_full": "java.nio.file.FileSystems:getDefault()",
                                                                          "lineNum": 156
                                                                      },
                                                                      {
                                                                          "method_hash": "-Nhm7eOJBGgzmhZBaA5sfQ#038",
                                                                          "method_full": "java.nio.file.FileSystem:getUserPrincipalLookupService()",
                                                                          "lineNum": 157
                                                                      },
                                                                      {
                                                                          "method_hash": "2FAUvlIeVW0jnPfIMNTX_A#05a",
                                                                          "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByName(java.lang.String)",
                                                                          "lineNum": 159
                                                                      },
                                                                      {
                                                                          "method_hash": "fYfF_awaLMmXS936f_v22g#05e",
                                                                          "method_full": "java.nio.file.attribute.PosixFileAttributeView:setOwner(java.nio.file.attribute.UserPrincipal)",
                                                                          "lineNum": 165
                                                                      },
                                                                      {
                                                                          "method_hash": "m1eHUeFrT21OqC9en-KKBw#05f",
                                                                          "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByGroupName(java.lang.String)",
                                                                          "lineNum": 169
                                                                      },
                                                                      {
                                                                          "method_hash": "1c57ZXQzPOWuMmLzVMNP1w#05f",
                                                                          "method_full": "java.nio.file.attribute.PosixFileAttributeView:setGroup(java.nio.file.attribute.GroupPrincipal)",
                                                                          "lineNum": 173
                                                                      },
                                                                      {
                                                                          "method_hash": "Xy81WN9lrGaKy6GdaorlPA#04c",
                                                                          "method_full": "java.nio.file.attribute.PosixFileAttributeView:setPermissions(java.util.Set)",
                                                                          "lineNum": 177
                                                                      }
                                                                  ]
                                                              },
                                                              {
                                                                  "method_hash": "UldRC_OpA4O_DkOj6iRhtQ#06a",
                                                                  "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                  "lineNum": 217
                                                              }
                                                          ]
                                                      }
                                                  ]
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "2zeqSMkVZh9oAdXTHYfv8A#067",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:setOutputStream(java.io.OutputStream)",
                                          "lineNum": 419
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                  "lineNum": 398
                              },
                              {
                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                  "method_full": "java.lang.Thread:currentThread()",
                                  "lineNum": 403
                              },
                              {
                                  "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                  "method_full": "java.lang.Thread:interrupt()",
                                  "lineNum": 403
                              },
                              {
                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                  "method_full": "java.lang.Thread:currentThread()",
                                  "lineNum": 403
                              },
                              {
                                  "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                  "method_full": "java.lang.Thread:interrupt()",
                                  "lineNum": 403
                              },
                              {
                                  "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                  "lineNum": 406
                              },
                              {
                                  "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                  "lineNum": 407
                              },
                              {
                                  "method_hash": "pyei62ud1ZkzkDUnIu6CJw#062",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverComplete(java.lang.String)",
                                  "lineNum": 409
                              },
                              {
                                  "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                  "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                  "lineNum": 411
                              }
                          ]
                      }
                  ]
              },
              {
                  "method_hash": "VQWm6xL5q97VTPaUpEzH3g#046",
                  "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:getFireTime()",
                  "lineNum": 151,
                  "children": [
                      {
                          "method_hash": "UgAi9LmAK-sHRUqWNsADZA#093",
                          "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:access$000(org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData)",
                          "lineNum": 38
                      }
                  ]
              }
          ]
      },
      {
          "method_hash": "bMoRM1MogztlFzL6scw1Eg#041",
          "method_full": "org.apache.logging.log4j.core.config.Configuration:getScheduler()",
          "lineNum": 80,
          "children": [
              {
                  "method_hash": "ZZdC4HTiFEiOh-yhBkW2RA#049",
                  "method_full": "org.apache.logging.log4j.core.config.AbstractConfiguration:getScheduler()",
                  "lineNum": 0
              }
          ]
      },
      {
          "method_hash": "OzEp6K0cEvsTdN36GBQQnw#052",
          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:isExecutorServiceSet()",
          "lineNum": 81
      },
      {
          "method_hash": "_bv0moHZmZSKEoNiP9Xhtg#055",
          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:incrementScheduledItems()",
          "lineNum": 83,
          "children": [
              {
                  "method_hash": "OzEp6K0cEvsTdN36GBQQnw#052",
                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:isExecutorServiceSet()",
                  "lineNum": 90
              },
              {
                  "method_hash": "rz4g57RjH3SrjKJXFg6Odw#048",
                  "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object)",
                  "lineNum": 91
              }
          ]
      },
      {
          "method_hash": "Yi-6KMm9ml5498WgjYat5g#047",
          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:isStarted()",
          "lineNum": 85,
          "children": [
              {
                  "method_hash": "BMfzeUTEwhtGbC9z0hin7g#03b",
                  "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:isStarted()",
                  "lineNum": 0
              }
          ]
      },
      {
          "method_hash": "r0uOQSfIjxEp814y00pUVA#043",
          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:start()",
          "lineNum": 86,
          "children": [
              {
                  "method_hash": "0LUt7OhHdX87NbJSTCVdcQ#037",
                  "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:start()",
                  "lineNum": 56,
                  "children": [
                      {
                          "method_hash": "3X9XfPVn-NMMZcYblwFImg#03c",
                          "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:setStarted()",
                          "lineNum": 131,
                          "children": [
                              {
                                  "method_hash": "f3Zsa7WP60oGoKMJauKuag#067",
                                  "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:setState(org.apache.logging.log4j.core.LifeCycle$State)",
                                  "lineNum": 103
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      {
          "method_hash": "urn2mVpqTPFhTEJYdll4dA#0e1",
          "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$CronTrigger:<init>(org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy,org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$1)",
          "lineNum": 89,
          "children": [
              {
                  "method_hash": "RqGdrN0vBLt06xzel_lNxA#09b",
                  "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$CronTrigger:<init>(org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy)",
                  "lineNum": 168,
                  "children": [
                      {
                          "method_hash": "s48xhk9TorXpI_3sTySsTg#055",
                          "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$CronTrigger:run()",
                          "lineNum": 0,
                          "children": [
                              {
                                  "method_hash": "TFeq-gS2Mx58u3UZ0w2_ZQ#093",
                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:access$100(org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy)",
                                  "lineNum": 172,
                                  "children": [
                                      {
                                          "method_hash": "YI2B90T3SoTSRrgivb3JWg#04e",
                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:rollover()",
                                          "lineNum": 41,
                                          "children": [
                                              {
                                                  "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                                  "method_full": "java.util.Date:<init>()",
                                                  "lineNum": 149
                                              },
                                              {
                                                  "method_hash": "IYT126XB_FarCFspnnqaMA#051",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
                                                  "lineNum": 149,
                                                  "children": [
                                                      {
                                                          "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                                                          "lineNum": 1616,
                                                          "children": [
                                                              {
                                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                  "lineNum": 1593,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                                          "lineNum": 360
                                                                      }
                                                                  ]
                                                              },
                                                              {
                                                                  "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                                                                  "lineNum": 1602,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                                                          "lineNum": 1621
                                                                      },
                                                                      {
                                                                          "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                                                          "lineNum": 1626
                                                                      },
                                                                      {
                                                                          "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                                                          "lineNum": 1631
                                                                      }
                                                                  ]
                                                              },
                                                              {
                                                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                                  "method_full": "java.util.Date:getTime()",
                                                                  "lineNum": 1605
                                                              },
                                                              {
                                                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                                  "method_full": "java.util.Date:<init>(long)",
                                                                  "lineNum": 1605
                                                              },
                                                              {
                                                                  "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                                                  "lineNum": 1606,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                          "lineNum": 1181,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                                  "method_full": "java.util.TimeZone:getDefault()",
                                                                                  "lineNum": 360
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                                          "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                                          "lineNum": 1181
                                                                      },
                                                                      {
                                                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                                          "method_full": "java.util.Date:getTime()",
                                                                          "lineNum": 1185
                                                                      },
                                                                      {
                                                                          "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                                          "method_full": "java.util.Date:<init>(long)",
                                                                          "lineNum": 1185
                                                                      },
                                                                      {
                                                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                          "method_full": "java.util.SortedSet:size()",
                                                                          "lineNum": 1203
                                                                      },
                                                                      {
                                                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                          "method_full": "java.util.SortedSet:first()",
                                                                          "lineNum": 1204
                                                                      },
                                                                      {
                                                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                          "method_full": "java.util.SortedSet:size()",
                                                                          "lineNum": 1218
                                                                      },
                                                                      {
                                                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                          "method_full": "java.util.SortedSet:first()",
                                                                          "lineNum": 1220
                                                                      },
                                                                      {
                                                                          "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                                          "lineNum": 1228
                                                                      },
                                                                      {
                                                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                          "method_full": "java.util.SortedSet:size()",
                                                                          "lineNum": 1239
                                                                      },
                                                                      {
                                                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                          "method_full": "java.util.SortedSet:first()",
                                                                          "lineNum": 1241
                                                                      },
                                                                      {
                                                                          "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                                          "lineNum": 1250
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1270,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1283,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                          "lineNum": 1286,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                                  "method_full": "java.util.TimeZone:getDefault()",
                                                                                  "lineNum": 360
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1294,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                                          "method_full": "java.util.Date:before(java.util.Date)",
                                                                          "lineNum": 1313
                                                                      },
                                                                      {
                                                                          "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                          "lineNum": 1322,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                                  "method_full": "java.util.TimeZone:getDefault()",
                                                                                  "lineNum": 360
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1330,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                                          "method_full": "java.util.Date:before(java.util.Date)",
                                                                          "lineNum": 1350
                                                                      },
                                                                      {
                                                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                          "method_full": "java.util.SortedSet:size()",
                                                                          "lineNum": 1354
                                                                      },
                                                                      {
                                                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                          "method_full": "java.util.SortedSet:first()",
                                                                          "lineNum": 1356
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1358,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1392,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1448,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                          "method_full": "java.util.SortedSet:size()",
                                                                          "lineNum": 1471
                                                                      },
                                                                      {
                                                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                          "method_full": "java.util.SortedSet:first()",
                                                                          "lineNum": 1472
                                                                      },
                                                                      {
                                                                          "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                          "lineNum": 1483,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                  "lineNum": 1676
                                                                              },
                                                                              {
                                                                                  "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                  "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                  "lineNum": 1698
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                                          "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                                          "lineNum": 1506
                                                                      },
                                                                      {
                                                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                          "method_full": "java.util.SortedSet:size()",
                                                                          "lineNum": 1525
                                                                      },
                                                                      {
                                                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                          "method_full": "java.util.SortedSet:first()",
                                                                          "lineNum": 1527
                                                                      },
                                                                      {
                                                                          "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                          "method_full": "java.util.SortedSet:size()",
                                                                          "lineNum": 1552
                                                                      },
                                                                      {
                                                                          "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                          "method_full": "java.util.SortedSet:first()",
                                                                          "lineNum": 1554
                                                                      }
                                                                  ]
                                                              },
                                                              {
                                                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                                  "method_full": "java.util.Date:before(java.util.Date)",
                                                                  "lineNum": 1607
                                                              },
                                                              {
                                                                  "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                                                                  "method_full": "java.util.Date:compareTo(java.util.Date)",
                                                                  "lineNum": 1611
                                                              }
                                                          ]
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "2-oiwc2UGpH9GvTVT4LZGg#069",
                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(java.util.Date,java.util.Date)",
                                                  "lineNum": 149,
                                                  "children": [
                                                      {
                                                          "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                                                          "lineNum": 365
                                                      },
                                                      {
                                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                          "method_full": "java.util.Date:getTime()",
                                                          "lineNum": 365
                                                      },
                                                      {
                                                          "method_hash": "Pd4jXDnoGS52ypFlKhyfdw#055",
                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setPrevFileTime(long)",
                                                          "lineNum": 365,
                                                          "children": [
                                                              {
                                                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                                  "method_full": "java.util.Date:<init>(long)",
                                                                  "lineNum": 130
                                                              },
                                                              {
                                                                  "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                                  "lineNum": 130
                                                              }
                                                          ]
                                                      },
                                                      {
                                                          "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                                                          "lineNum": 366
                                                      },
                                                      {
                                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                          "method_full": "java.util.Date:getTime()",
                                                          "lineNum": 366
                                                      },
                                                      {
                                                          "method_hash": "_aSSFev0lN8qJ2mHjSRnPw#058",
                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setCurrentFileTime(long)",
                                                          "lineNum": 366
                                                      },
                                                      {
                                                          "method_hash": "yEK9OH_vMu2UitWu13C0UA#04c",
                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover()",
                                                          "lineNum": 367,
                                                          "children": [
                                                              {
                                                                  "method_hash": "22fB1RUA3ApXNcv9n1HV8Q#053",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:hasOutputStream()",
                                                                  "lineNum": 371
                                                              },
                                                              {
                                                                  "method_hash": "BvVWLsTDU5RcjdOW-PGbfA#054",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isCreateOnDemand()",
                                                                  "lineNum": 371,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "7ohN_DEounvTU1s1UrEQNw#045",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:isCreateOnDemand()",
                                                                          "lineNum": 0
                                                                      }
                                                                  ]
                                                              },
                                                              {
                                                                  "method_hash": "hvjVivV82nkf7x_ZUrEplw#051",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isDirectWrite()",
                                                                  "lineNum": 371
                                                              },
                                                              {
                                                                  "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                                                  "lineNum": 375
                                                              },
                                                              {
                                                                  "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                                                  "lineNum": 376
                                                              },
                                                              {
                                                                  "method_hash": "T6eyAlcOOXnt7c4jBsO7Og#063",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverTriggered(java.lang.String)",
                                                                  "lineNum": 378
                                                              },
                                                              {
                                                                  "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                                                  "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                  "lineNum": 380
                                                              },
                                                              {
                                                                  "method_hash": "r45QCSKe6mKx0tjYqG5dZQ#01e",
                                                                  "method_full": "java.lang.Thread:interrupted()",
                                                                  "lineNum": 386
                                                              },
                                                              {
                                                                  "method_hash": "9AOFgj6cjqniC2_1VW6jGQ#036",
                                                                  "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String)",
                                                                  "lineNum": 389
                                                              },
                                                              {
                                                                  "method_hash": "6Vb11-rGm8zCk6l3sSladQ#08b",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(org.apache.logging.log4j.core.appender.rolling.RolloverStrategy)",
                                                                  "lineNum": 392,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "QNFPuXg6R-1kHuwbiT2oGQ#028",
                                                                          "method_full": "java.util.concurrent.Semaphore:acquire()",
                                                                          "lineNum": 492
                                                                      },
                                                                      {
                                                                          "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                                                          "lineNum": 495
                                                                      },
                                                                      {
                                                                          "method_hash": "02pC5aI3pVadW5t6FJG2jA#08b",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverStrategy:rollover(org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                                                          "lineNum": 502
                                                                      },
                                                                      {
                                                                          "method_hash": "xz9uxGWYYDRcxnnc-ldQZA#04f",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:writeFooter()",
                                                                          "lineNum": 504
                                                                      },
                                                                      {
                                                                          "method_hash": "R1Ciu543VORoW7D4n0-37Q#055",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:closeOutputStream()",
                                                                          "lineNum": 505
                                                                      },
                                                                      {
                                                                          "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                                                          "lineNum": 506,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                                                          "lineNum": 507,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                                          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                                          "lineNum": 507
                                                                      },
                                                                      {
                                                                          "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                                                          "lineNum": 509,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "xC6DufXbTNEVUIsJ4uOkDA#046",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.action.Action:execute()",
                                                                          "lineNum": 509
                                                                      },
                                                                      {
                                                                          "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                                                          "lineNum": 512
                                                                      },
                                                                      {
                                                                          "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                                                          "lineNum": 516,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                                                          "lineNum": 517,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                                          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                                          "lineNum": 517
                                                                      },
                                                                      {
                                                                          "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                                                          "lineNum": 518,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                                                  "lineNum": 0
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "n8fdAnY0OWxG7IDXCzMHUg#0d4",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager$AsyncAction:<init>(org.apache.logging.log4j.core.appender.rolling.action.Action,org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                                                          "lineNum": 518,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "zSCDY7xBHieHlFNQCyWJvQ#04d",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.action.AbstractAction:<init>()",
                                                                                  "lineNum": 545
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "zTsT_sEXWAqLn-yIjM0VyA#040",
                                                                          "method_full": "java.util.concurrent.ExecutorService:execute(java.lang.Runnable)",
                                                                          "lineNum": 518
                                                                      },
                                                                      {
                                                                          "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                                                          "method_full": "java.util.concurrent.Semaphore:release()",
                                                                          "lineNum": 526
                                                                      },
                                                                      {
                                                                          "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                                                          "method_full": "java.util.concurrent.Semaphore:release()",
                                                                          "lineNum": 526
                                                                      },
                                                                      {
                                                                          "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                                                          "method_full": "java.util.concurrent.Semaphore:release()",
                                                                          "lineNum": 526
                                                                      }
                                                                  ]
                                                              },
                                                              {
                                                                  "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                                                  "method_full": "java.lang.System:currentTimeMillis()",
                                                                  "lineNum": 395
                                                              },
                                                              {
                                                                  "method_hash": "nv9gbzB7gdOlPgkYR1-d1A#05b",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createFileAfterRollover()",
                                                                  "lineNum": 396,
                                                                  "children": [
                                                                      {
                                                                          "method_hash": "yqOGdtCv9LlO2pyzHfPBJg#056",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createOutputStream()",
                                                                          "lineNum": 419,
                                                                          "children": [
                                                                              {
                                                                                  "method_hash": "04hWR-wNgeVlAbTaX413iQ#047",
                                                                                  "method_full": "org.apache.logging.log4j.core.appender.FileManager:createOutputStream()",
                                                                                  "lineNum": 0,
                                                                                  "children": [
                                                                                      {
                                                                                          "method_hash": "kUUtyE-yshpkrlLF8CizJQ#040",
                                                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:getFileName()",
                                                                                          "lineNum": 188,
                                                                                          "children": [
                                                                                              {
                                                                                                  "method_hash": "AjqeyG3azkKFvR0N-tS_ww#03c",
                                                                                                  "method_full": "org.apache.logging.log4j.core.appender.FileManager:getName()",
                                                                                                  "lineNum": 286,
                                                                                                  "children": [
                                                                                                      {
                                                                                                          "method_hash": "rG7hUyPbbfhJR24G1aun9g#044",
                                                                                                          "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:getName()",
                                                                                                          "lineNum": 0,
                                                                                                          "children": [
                                                                                                              {
                                                                                                                  "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                                                  "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                                                  "lineNum": 0
                                                                                                              }
                                                                                                          ]
                                                                                                      }
                                                                                                  ]
                                                                                              }
                                                                                          ]
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                                                                          "method_full": "java.util.Date:<init>()",
                                                                                          "lineNum": 189
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                                                          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                                                          "lineNum": 189
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "bVcWvqzqttgH8z2t2R8_UA#025",
                                                                                          "method_full": "java.io.File:<init>(java.lang.String)",
                                                                                          "lineNum": 190
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "dO6Tsyiv9mWcpx5mclu1hw#050",
                                                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:createParentDir(java.io.File)",
                                                                                          "lineNum": 191
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "Vcg5W6E6Et4xchwVhfV3Aw#035",
                                                                                          "method_full": "java.io.FileOutputStream:<init>(java.io.File,boolean)",
                                                                                          "lineNum": 192
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "h5sUwZofbSPjw3FsIyNmuw#015",
                                                                                          "method_full": "java.io.File:exists()",
                                                                                          "lineNum": 193
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "jEwGDKaNxrqlr_Fu5LBEGg#015",
                                                                                          "method_full": "java.io.File:length()",
                                                                                          "lineNum": 193
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                                                                          "method_full": "java.lang.System:currentTimeMillis()",
                                                                                          "lineNum": 195
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "XTRqcn8pEc_W7IDattsO4A#031",
                                                                                          "method_full": "java.nio.file.attribute.FileTime:fromMillis(long)",
                                                                                          "lineNum": 195
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "0qQVGMvv1qmA4ZkhtzHmzQ#015",
                                                                                          "method_full": "java.io.File:toPath()",
                                                                                          "lineNum": 196
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "frQm5mNTus-YYezDKI4BrA#071",
                                                                                          "method_full": "java.nio.file.Files:setAttribute(java.nio.file.Path,java.lang.String,java.lang.Object,java.nio.file.LinkOption[])",
                                                                                          "lineNum": 196
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "zTk20a5at3-bP7-ZuCovDw#047",
                                                                                          "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object)",
                                                                                          "lineNum": 198
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "rX3OlAkJ11jSH_NiV_ryMQ#054",
                                                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:writeHeader(java.io.OutputStream)",
                                                                                          "lineNum": 200,
                                                                                          "children": [
                                                                                              {
                                                                                                  "method_hash": "HxZd6k-iTe3nt1fJyIbtfA#05c",
                                                                                                  "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:writeHeader(java.io.OutputStream)",
                                                                                                  "lineNum": 0,
                                                                                                  "children": [
                                                                                                      {
                                                                                                          "method_hash": "8o28hTGaDSpneaWxiHyQbA#030",
                                                                                                          "method_full": "org.apache.logging.log4j.core.Layout:getHeader()",
                                                                                                          "lineNum": 127,
                                                                                                          "children": [
                                                                                                              {
                                                                                                                  "method_hash": "Zolp049DcmF04lVMNA_Hmw#03f",
                                                                                                                  "method_full": "org.apache.logging.log4j.core.layout.AbstractLayout:getHeader()",
                                                                                                                  "lineNum": 0
                                                                                                              }
                                                                                                          ]
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "Pew9p1cKFRIdw-TF-2HLRw#02a",
                                                                                                          "method_full": "java.io.OutputStream:write(byte[],int,int)",
                                                                                                          "lineNum": 130
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "vIpY5gly7pSa9E-OUOebtA#069",
                                                                                                          "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:logError(java.lang.String,java.lang.Throwable)",
                                                                                                          "lineNum": 132,
                                                                                                          "children": [
                                                                                                              {
                                                                                                                  "method_hash": "-p4pq5TXjyh1ivdMMKEeXw#065",
                                                                                                                  "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:logError(java.lang.String,java.lang.Throwable)",
                                                                                                                  "lineNum": 0,
                                                                                                                  "children": [
                                                                                                                      {
                                                                                                                          "method_hash": "WeZJT46eBnjyxwyc89RvrA#07f",
                                                                                                                          "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:log(org.apache.logging.log4j.Level,java.lang.String,java.lang.Throwable)",
                                                                                                                          "lineNum": 243,
                                                                                                                          "children": [
                                                                                                                              {
                                                                                                                                  "method_hash": "k9RmyBKtgxgjYHxQbALiow#033",
                                                                                                                                  "method_full": "org.apache.logging.log4j.Logger:getMessageFactory()",
                                                                                                                                  "lineNum": 233
                                                                                                                              },
                                                                                                                              {
                                                                                                                                  "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                                                                  "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                                                                  "lineNum": 234
                                                                                                                              },
                                                                                                                              {
                                                                                                                                  "method_hash": "FrMlsynGLAVgglkclwZW5Q#05f",
                                                                                                                                  "method_full": "org.apache.logging.log4j.message.MessageFactory:newMessage(java.lang.String,java.lang.Object[])",
                                                                                                                                  "lineNum": 233
                                                                                                                              },
                                                                                                                              {
                                                                                                                                  "method_hash": "ssQL2kR6f7fV2aYFpu0JBQ#080",
                                                                                                                                  "method_full": "org.apache.logging.log4j.Logger:log(org.apache.logging.log4j.Level,org.apache.logging.log4j.message.Message,java.lang.Throwable)",
                                                                                                                                  "lineNum": 235
                                                                                                                              }
                                                                                                                          ]
                                                                                                                      }
                                                                                                                  ]
                                                                                                              }
                                                                                                          ]
                                                                                                      }
                                                                                                  ]
                                                                                              }
                                                                                          ]
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "V1UxhLaycijayebyEX29QQ#03c",
                                                                                          "method_full": "java.nio.file.Paths:get(java.lang.String,java.lang.String[])",
                                                                                          "lineNum": 202
                                                                                      },
                                                                                      {
                                                                                          "method_hash": "v7hcG_w3P185cHZn9H4zaw#05a",
                                                                                          "method_full": "org.apache.logging.log4j.core.appender.FileManager:defineAttributeView(java.nio.file.Path)",
                                                                                          "lineNum": 202,
                                                                                          "children": [
                                                                                              {
                                                                                                  "method_hash": "dJ-R_QAcjdry6NhECWPloQ#01b",
                                                                                                  "method_full": "java.nio.file.Path:toFile()",
                                                                                                  "lineNum": 213
                                                                                              },
                                                                                              {
                                                                                                  "method_hash": "kb_oR9deZH3YU2zLFbGHag#01c",
                                                                                                  "method_full": "java.io.File:createNewFile()",
                                                                                                  "lineNum": 213
                                                                                              },
                                                                                              {
                                                                                                  "method_hash": "jqL9hd_q_9uyCT2VIpT6ig#08d",
                                                                                                  "method_full": "org.apache.logging.log4j.core.util.FileUtils:defineFilePosixAttributeView(java.nio.file.Path,java.util.Set,java.lang.String,java.lang.String)",
                                                                                                  "lineNum": 215,
                                                                                                  "children": [
                                                                                                      {
                                                                                                          "method_hash": "JxFEWpwCG5b9mrXZxE1N3Q#067",
                                                                                                          "method_full": "java.nio.file.Files:getFileAttributeView(java.nio.file.Path,java.lang.Class,java.nio.file.LinkOption[])",
                                                                                                          "lineNum": 154
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "Ae1bRXNtUA_XChmiVWvpbw#026",
                                                                                                          "method_full": "java.nio.file.FileSystems:getDefault()",
                                                                                                          "lineNum": 156
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "-Nhm7eOJBGgzmhZBaA5sfQ#038",
                                                                                                          "method_full": "java.nio.file.FileSystem:getUserPrincipalLookupService()",
                                                                                                          "lineNum": 157
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "2FAUvlIeVW0jnPfIMNTX_A#05a",
                                                                                                          "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByName(java.lang.String)",
                                                                                                          "lineNum": 159
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "fYfF_awaLMmXS936f_v22g#05e",
                                                                                                          "method_full": "java.nio.file.attribute.PosixFileAttributeView:setOwner(java.nio.file.attribute.UserPrincipal)",
                                                                                                          "lineNum": 165
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "m1eHUeFrT21OqC9en-KKBw#05f",
                                                                                                          "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByGroupName(java.lang.String)",
                                                                                                          "lineNum": 169
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "1c57ZXQzPOWuMmLzVMNP1w#05f",
                                                                                                          "method_full": "java.nio.file.attribute.PosixFileAttributeView:setGroup(java.nio.file.attribute.GroupPrincipal)",
                                                                                                          "lineNum": 173
                                                                                                      },
                                                                                                      {
                                                                                                          "method_hash": "Xy81WN9lrGaKy6GdaorlPA#04c",
                                                                                                          "method_full": "java.nio.file.attribute.PosixFileAttributeView:setPermissions(java.util.Set)",
                                                                                                          "lineNum": 177
                                                                                                      }
                                                                                                  ]
                                                                                              },
                                                                                              {
                                                                                                  "method_hash": "UldRC_OpA4O_DkOj6iRhtQ#06a",
                                                                                                  "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                                                  "lineNum": 217
                                                                                              }
                                                                                          ]
                                                                                      }
                                                                                  ]
                                                                              }
                                                                          ]
                                                                      },
                                                                      {
                                                                          "method_hash": "2zeqSMkVZh9oAdXTHYfv8A#067",
                                                                          "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:setOutputStream(java.io.OutputStream)",
                                                                          "lineNum": 419
                                                                      }
                                                                  ]
                                                              },
                                                              {
                                                                  "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                                                  "lineNum": 398
                                                              },
                                                              {
                                                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                  "method_full": "java.lang.Thread:currentThread()",
                                                                  "lineNum": 403
                                                              },
                                                              {
                                                                  "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                                                  "method_full": "java.lang.Thread:interrupt()",
                                                                  "lineNum": 403
                                                              },
                                                              {
                                                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                  "method_full": "java.lang.Thread:currentThread()",
                                                                  "lineNum": 403
                                                              },
                                                              {
                                                                  "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                                                  "method_full": "java.lang.Thread:interrupt()",
                                                                  "lineNum": 403
                                                              },
                                                              {
                                                                  "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                                                  "lineNum": 406
                                                              },
                                                              {
                                                                  "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                                                  "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                                                  "lineNum": 407
                                                              },
                                                              {
                                                                  "method_hash": "pyei62ud1ZkzkDUnIu6CJw#062",
                                                                  "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverComplete(java.lang.String)",
                                                                  "lineNum": 409
                                                              },
                                                              {
                                                                  "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                                                  "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                  "lineNum": 411
                                                              }
                                                          ]
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "VQWm6xL5q97VTPaUpEzH3g#046",
                                                  "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:getFireTime()",
                                                  "lineNum": 151,
                                                  "children": [
                                                      {
                                                          "method_hash": "UgAi9LmAK-sHRUqWNsADZA#093",
                                                          "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:access$000(org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData)",
                                                          "lineNum": 38
                                                      }
                                                  ]
                                              }
                                          ]
                                      }
                                  ]
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      {
          "method_hash": "FvzLmegVkHqN68Arszd_Dw#0a1",
          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:scheduleWithCron(org.apache.logging.log4j.core.util.CronExpression,java.util.Date,java.lang.Runnable)",
          "lineNum": 89,
          "children": [
              {
                  "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                  "method_full": "java.util.Date:<init>()",
                  "lineNum": 150
              },
              {
                  "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                  "lineNum": 150,
                  "children": [
                      {
                          "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                          "lineNum": 311,
                          "children": [
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1181,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                  "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                  "lineNum": 1181
                              },
                              {
                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                  "method_full": "java.util.Date:getTime()",
                                  "lineNum": 1185
                              },
                              {
                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                  "method_full": "java.util.Date:<init>(long)",
                                  "lineNum": 1185
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1203
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1204
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1218
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1220
                              },
                              {
                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                  "lineNum": 1228
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1239
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1241
                              },
                              {
                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                  "lineNum": 1250
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1270,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1283,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1286,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1294,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                  "method_full": "java.util.Date:before(java.util.Date)",
                                  "lineNum": 1313
                              },
                              {
                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                  "lineNum": 1322,
                                  "children": [
                                      {
                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                          "method_full": "java.util.TimeZone:getDefault()",
                                          "lineNum": 360
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1330,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                  "method_full": "java.util.Date:before(java.util.Date)",
                                  "lineNum": 1350
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1354
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1356
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1358,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1392,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1448,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1471
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1472
                              },
                              {
                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                  "lineNum": 1483,
                                  "children": [
                                      {
                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                          "lineNum": 1676
                                      },
                                      {
                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                          "lineNum": 1698
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                  "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                  "lineNum": 1506
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1525
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1527
                              },
                              {
                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                  "method_full": "java.util.SortedSet:size()",
                                  "lineNum": 1552
                              },
                              {
                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                  "method_full": "java.util.SortedSet:first()",
                                  "lineNum": 1554
                              }
                          ]
                      }
                  ]
              },
              {
                  "method_hash": "iAewsRT1cbxXWcM5kgR4hw#0d1",
                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler$CronRunnable:<init>(org.apache.logging.log4j.core.config.ConfigurationScheduler,java.lang.Runnable,org.apache.logging.log4j.core.util.CronExpression)",
                  "lineNum": 151,
                  "children": [
                      {
                          "method_hash": "ruQqG0yrVkObB_Lt7wfg4w#04e",
                          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler$CronRunnable:run()",
                          "lineNum": 0,
                          "children": [
                              {
                                  "method_hash": "VQWm6xL5q97VTPaUpEzH3g#046",
                                  "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:getFireTime()",
                                  "lineNum": 233,
                                  "children": [
                                      {
                                          "method_hash": "UgAi9LmAK-sHRUqWNsADZA#093",
                                          "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:access$000(org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData)",
                                          "lineNum": 38
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                  "method_full": "java.util.Date:getTime()",
                                  "lineNum": 233
                              },
                              {
                                  "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                  "method_full": "java.lang.System:currentTimeMillis()",
                                  "lineNum": 233
                              },
                              {
                                  "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                  "lineNum": 235
                              },
                              {
                                  "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                  "lineNum": 235
                              },
                              {
                                  "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                  "lineNum": 235
                              },
                              {
                                  "method_hash": "I-14UUNhrKJwDmNJ4WcexA#01c",
                                  "method_full": "java.lang.Thread:sleep(long)",
                                  "lineNum": 237
                              },
                              {
                                  "method_hash": "5al39h2bFBQQAEVODcvt3w#018",
                                  "method_full": "java.lang.Runnable:run()",
                                  "lineNum": 242
                              },
                              {
                                  "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                  "method_full": "java.util.Date:<init>()",
                                  "lineNum": 246
                              },
                              {
                                  "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                                  "lineNum": 246,
                                  "children": [
                                      {
                                          "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                          "lineNum": 311,
                                          "children": [
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1181,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                  "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                  "lineNum": 1181
                                              },
                                              {
                                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                  "method_full": "java.util.Date:getTime()",
                                                  "lineNum": 1185
                                              },
                                              {
                                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                  "method_full": "java.util.Date:<init>(long)",
                                                  "lineNum": 1185
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1203
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1204
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1218
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1220
                                              },
                                              {
                                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                  "lineNum": 1228
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1239
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1241
                                              },
                                              {
                                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                  "lineNum": 1250
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1270,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1283,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1286,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1294,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                  "method_full": "java.util.Date:before(java.util.Date)",
                                                  "lineNum": 1313
                                              },
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1322,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1330,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                  "method_full": "java.util.Date:before(java.util.Date)",
                                                  "lineNum": 1350
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1354
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1356
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1358,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1392,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1448,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1471
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1472
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1483,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                  "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                  "lineNum": 1506
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1525
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1527
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1552
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1554
                                              }
                                          ]
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                                  "lineNum": 247,
                                  "children": [
                                      {
                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                          "method_full": "java.util.Date:getTime()",
                                          "lineNum": 190
                                      },
                                      {
                                          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                          "method_full": "java.util.Date:<init>()",
                                          "lineNum": 190
                                      },
                                      {
                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                          "method_full": "java.util.Date:getTime()",
                                          "lineNum": 190
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                  "lineNum": 247,
                                  "children": [
                                      {
                                          "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                                          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                                          "lineNum": 128,
                                          "children": [
                                              {
                                                  "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                  "lineNum": 198
                                              },
                                              {
                                                  "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                                  "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                                  "lineNum": 201,
                                                  "children": [
                                                      {
                                                          "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                                          "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                                          "lineNum": 40,
                                                          "children": [
                                                              {
                                                                  "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                                  "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                                  "lineNum": 76
                                                              },
                                                              {
                                                                  "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                                  "method_full": "java.lang.System:getSecurityManager()",
                                                                  "lineNum": 79
                                                              },
                                                              {
                                                                  "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                                  "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                                  "lineNum": 80
                                                              },
                                                              {
                                                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                  "method_full": "java.lang.Thread:currentThread()",
                                                                  "lineNum": 81
                                                              },
                                                              {
                                                                  "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                                  "method_full": "java.lang.Thread:getThreadGroup()",
                                                                  "lineNum": 81
                                                              }
                                                          ]
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                                  "lineNum": 201
                                              },
                                              {
                                                  "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                                  "lineNum": 202
                                              },
                                              {
                                                  "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                                  "lineNum": 203
                                              },
                                              {
                                                  "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                  "lineNum": 207
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                                          "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                          "lineNum": 128
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "PQYqdOCRLdDwLxXTnGhDaA#073",
                                  "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:reset(java.util.concurrent.ScheduledFuture,java.util.Date)",
                                  "lineNum": 250,
                                  "children": [
                                      {
                                          "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                                          "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                                          "lineNum": 42
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                  "lineNum": 244
                              },
                              {
                                  "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                  "lineNum": 244
                              },
                              {
                                  "method_hash": "gA3yxChI30QQ5AdTGgDDxA#059",
                                  "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object,java.lang.Object)",
                                  "lineNum": 244
                              },
                              {
                                  "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                  "method_full": "java.util.Date:<init>()",
                                  "lineNum": 246
                              },
                              {
                                  "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                                  "lineNum": 246,
                                  "children": [
                                      {
                                          "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                          "lineNum": 311,
                                          "children": [
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1181,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                  "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                  "lineNum": 1181
                                              },
                                              {
                                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                  "method_full": "java.util.Date:getTime()",
                                                  "lineNum": 1185
                                              },
                                              {
                                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                  "method_full": "java.util.Date:<init>(long)",
                                                  "lineNum": 1185
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1203
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1204
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1218
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1220
                                              },
                                              {
                                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                  "lineNum": 1228
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1239
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1241
                                              },
                                              {
                                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                  "lineNum": 1250
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1270,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1283,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1286,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1294,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                  "method_full": "java.util.Date:before(java.util.Date)",
                                                  "lineNum": 1313
                                              },
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1322,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1330,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                  "method_full": "java.util.Date:before(java.util.Date)",
                                                  "lineNum": 1350
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1354
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1356
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1358,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1392,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1448,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1471
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1472
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1483,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                  "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                  "lineNum": 1506
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1525
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1527
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1552
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1554
                                              }
                                          ]
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                                  "lineNum": 247,
                                  "children": [
                                      {
                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                          "method_full": "java.util.Date:getTime()",
                                          "lineNum": 190
                                      },
                                      {
                                          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                          "method_full": "java.util.Date:<init>()",
                                          "lineNum": 190
                                      },
                                      {
                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                          "method_full": "java.util.Date:getTime()",
                                          "lineNum": 190
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                  "lineNum": 247,
                                  "children": [
                                      {
                                          "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                                          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                                          "lineNum": 128,
                                          "children": [
                                              {
                                                  "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                  "lineNum": 198
                                              },
                                              {
                                                  "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                                  "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                                  "lineNum": 201,
                                                  "children": [
                                                      {
                                                          "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                                          "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                                          "lineNum": 40,
                                                          "children": [
                                                              {
                                                                  "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                                  "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                                  "lineNum": 76
                                                              },
                                                              {
                                                                  "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                                  "method_full": "java.lang.System:getSecurityManager()",
                                                                  "lineNum": 79
                                                              },
                                                              {
                                                                  "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                                  "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                                  "lineNum": 80
                                                              },
                                                              {
                                                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                  "method_full": "java.lang.Thread:currentThread()",
                                                                  "lineNum": 81
                                                              },
                                                              {
                                                                  "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                                  "method_full": "java.lang.Thread:getThreadGroup()",
                                                                  "lineNum": 81
                                                              }
                                                          ]
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                                  "lineNum": 201
                                              },
                                              {
                                                  "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                                  "lineNum": 202
                                              },
                                              {
                                                  "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                                  "lineNum": 203
                                              },
                                              {
                                                  "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                  "lineNum": 207
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                                          "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                          "lineNum": 128
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "PQYqdOCRLdDwLxXTnGhDaA#073",
                                  "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:reset(java.util.concurrent.ScheduledFuture,java.util.Date)",
                                  "lineNum": 250,
                                  "children": [
                                      {
                                          "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                                          "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                                          "lineNum": 42
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                  "method_full": "java.util.Date:<init>()",
                                  "lineNum": 246
                              },
                              {
                                  "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                                  "lineNum": 246,
                                  "children": [
                                      {
                                          "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                          "lineNum": 311,
                                          "children": [
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1181,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                  "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                  "lineNum": 1181
                                              },
                                              {
                                                  "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                  "method_full": "java.util.Date:getTime()",
                                                  "lineNum": 1185
                                              },
                                              {
                                                  "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                  "method_full": "java.util.Date:<init>(long)",
                                                  "lineNum": 1185
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1203
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1204
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1218
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1220
                                              },
                                              {
                                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                  "lineNum": 1228
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1239
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1241
                                              },
                                              {
                                                  "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                  "lineNum": 1250
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1270,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1283,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1286,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1294,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                  "method_full": "java.util.Date:before(java.util.Date)",
                                                  "lineNum": 1313
                                              },
                                              {
                                                  "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                  "lineNum": 1322,
                                                  "children": [
                                                      {
                                                          "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                          "method_full": "java.util.TimeZone:getDefault()",
                                                          "lineNum": 360
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1330,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                  "method_full": "java.util.Date:before(java.util.Date)",
                                                  "lineNum": 1350
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1354
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1356
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1358,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1392,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1448,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1471
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1472
                                              },
                                              {
                                                  "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                  "lineNum": 1483,
                                                  "children": [
                                                      {
                                                          "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                          "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                          "lineNum": 1676
                                                      },
                                                      {
                                                          "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                          "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                          "lineNum": 1698
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                  "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                  "lineNum": 1506
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1525
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1527
                                              },
                                              {
                                                  "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                  "method_full": "java.util.SortedSet:size()",
                                                  "lineNum": 1552
                                              },
                                              {
                                                  "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                  "method_full": "java.util.SortedSet:first()",
                                                  "lineNum": 1554
                                              }
                                          ]
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                                  "lineNum": 247,
                                  "children": [
                                      {
                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                          "method_full": "java.util.Date:getTime()",
                                          "lineNum": 190
                                      },
                                      {
                                          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                          "method_full": "java.util.Date:<init>()",
                                          "lineNum": 190
                                      },
                                      {
                                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                          "method_full": "java.util.Date:getTime()",
                                          "lineNum": 190
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                  "lineNum": 247,
                                  "children": [
                                      {
                                          "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                                          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                                          "lineNum": 128,
                                          "children": [
                                              {
                                                  "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                  "lineNum": 198
                                              },
                                              {
                                                  "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                                  "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                                  "lineNum": 201,
                                                  "children": [
                                                      {
                                                          "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                                          "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                                          "lineNum": 40,
                                                          "children": [
                                                              {
                                                                  "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                                  "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                                  "lineNum": 76
                                                              },
                                                              {
                                                                  "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                                  "method_full": "java.lang.System:getSecurityManager()",
                                                                  "lineNum": 79
                                                              },
                                                              {
                                                                  "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                                  "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                                  "lineNum": 80
                                                              },
                                                              {
                                                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                  "method_full": "java.lang.Thread:currentThread()",
                                                                  "lineNum": 81
                                                              },
                                                              {
                                                                  "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                                  "method_full": "java.lang.Thread:getThreadGroup()",
                                                                  "lineNum": 81
                                                              }
                                                          ]
                                                      }
                                                  ]
                                              },
                                              {
                                                  "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                                  "lineNum": 201
                                              },
                                              {
                                                  "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                                  "lineNum": 202
                                              },
                                              {
                                                  "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                                  "lineNum": 203
                                              },
                                              {
                                                  "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                  "lineNum": 207
                                              }
                                          ]
                                      },
                                      {
                                          "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                                          "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                          "lineNum": 128
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                  "lineNum": 248
                              },
                              {
                                  "method_hash": "PQYqdOCRLdDwLxXTnGhDaA#073",
                                  "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:reset(java.util.concurrent.ScheduledFuture,java.util.Date)",
                                  "lineNum": 250,
                                  "children": [
                                      {
                                          "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                                          "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                                          "lineNum": 42
                                      }
                                  ]
                              }
                          ]
                      }
                  ]
              },
              {
                  "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                  "lineNum": 152,
                  "children": [
                      {
                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                          "method_full": "java.util.Date:getTime()",
                          "lineNum": 190
                      },
                      {
                          "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                          "method_full": "java.util.Date:<init>()",
                          "lineNum": 190
                      },
                      {
                          "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                          "method_full": "java.util.Date:getTime()",
                          "lineNum": 190
                      }
                  ]
              },
              {
                  "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                  "lineNum": 152,
                  "children": [
                      {
                          "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                          "lineNum": 128,
                          "children": [
                              {
                                  "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                  "lineNum": 198
                              },
                              {
                                  "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                  "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                  "lineNum": 201,
                                  "children": [
                                      {
                                          "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                          "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                          "lineNum": 40,
                                          "children": [
                                              {
                                                  "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                  "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                  "lineNum": 76
                                              },
                                              {
                                                  "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                  "method_full": "java.lang.System:getSecurityManager()",
                                                  "lineNum": 79
                                              },
                                              {
                                                  "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                  "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                  "lineNum": 80
                                              },
                                              {
                                                  "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                  "method_full": "java.lang.Thread:currentThread()",
                                                  "lineNum": 81
                                              },
                                              {
                                                  "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                  "method_full": "java.lang.Thread:getThreadGroup()",
                                                  "lineNum": 81
                                              }
                                          ]
                                      }
                                  ]
                              },
                              {
                                  "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                  "lineNum": 201
                              },
                              {
                                  "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                  "lineNum": 202
                              },
                              {
                                  "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                  "lineNum": 203
                              },
                              {
                                  "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                  "lineNum": 207
                              }
                          ]
                      },
                      {
                          "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                          "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                          "lineNum": 128
                      }
                  ]
              },
              {
                  "method_hash": "8FLI_8Gm6FuyBpzDi693Xw#074",
                  "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:<init>(java.util.concurrent.ScheduledFuture,java.util.Date)",
                  "lineNum": 153,
                  "children": [
                      {
                          "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                          "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                          "lineNum": 34
                      }
                  ]
              },
              {
                  "method_hash": "7moi1k3s3T4xoFwRASyZ7g#095",
                  "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler$CronRunnable:setScheduledFuture(org.apache.logging.log4j.core.config.CronScheduledFuture)",
                  "lineNum": 154
              },
              {
                  "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                  "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                  "lineNum": 155
              },
              {
                  "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                  "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                  "lineNum": 155
              }
          ]
      },
      {
          "method_hash": "cVLTuaFyytgryy6SwI6jcg#046",
          "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:toString()",
          "lineNum": 90,
          "children": [
              {
                  "method_hash": "BJ9sucfIlfAP89goymWNcg#03b",
                  "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:getQueue()",
                  "lineNum": 266
              }
          ]
      },
      {
          "method_hash": "pUUVpJGDv5bVG0WsKYvqoQ#037",
          "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String)",
          "lineNum": 90
      }
  ]
}`;

let data3 = `
{
  "method_hash": "9lUz1PxsHtwpH_m0v7Aewg#08d",
  "method_full": "com.alibaba.fastjson2.reader.ObjectReaderBaseModule:getObjectReader(com.alibaba.fastjson2.reader.ObjectReaderProvider,java.lang.reflect.Type)",
  "children": [
      {
          "method_hash": "2uHAQlRAO1VmDc3j4IdfyQ#024",
          "method_full": "java.lang.reflect.Type:getTypeName()",
          "lineNum": 1145
      },
      {
          "method_hash": "RwfNc-ILD_P0dYQUUQZi1Q#038",
          "method_full": "java.util.concurrent.ConcurrentMap:get(java.lang.Object)",
          "lineNum": 1184
      },
      {
          "method_hash": "lUaqb6uWytYwj-6uaWQVjg#051",
          "method_full": "java.util.concurrent.ConcurrentMap:putIfAbsent(java.lang.Object,java.lang.Object)",
          "lineNum": 1188
      },
      {
          "method_hash": "2ktolgkUCVLLoBXVR4PE9A#030",
          "method_full": "java.lang.reflect.ParameterizedType:getRawType()",
          "lineNum": 1467
      },
      {
          "method_hash": "tD2FagHmtjpQ8428hewIng#03c",
          "method_full": "java.lang.reflect.ParameterizedType:getActualTypeArguments()",
          "lineNum": 1469
      },
      {
          "method_hash": "2uHAQlRAO1VmDc3j4IdfyQ#024",
          "method_full": "java.lang.reflect.Type:getTypeName()",
          "lineNum": 1502
      },
      {
          "method_hash": "2uHAQlRAO1VmDc3j4IdfyQ#024",
          "method_full": "java.lang.reflect.Type:getTypeName()",
          "lineNum": 1584
      },
      {
          "method_hash": "_jD-fVUQ_nUXLEBa54Ogtg#03c",
          "method_full": "java.lang.reflect.GenericArrayType:getGenericComponentType()",
          "lineNum": 1606
      },
      {
          "method_hash": "NatC6sngeeuN0kGKJqgt2Q#02f",
          "method_full": "java.lang.reflect.WildcardType:getUpperBounds()",
          "lineNum": 1610
      }
  ]
}`;
  let myxml2 = this.transferCallGraph2Dgml(data3);
    try {
      this.directedGraph = dgmlParser.parseDgmlXml(myxml2, this.config);
    } catch (ex) {
      this.directedGraph = undefined;
    }
    if (this.directedGraph === undefined) {
      const errorMessage = typeof this.directedGraph === 'string' ? this.directedGraph : `The xml file could not be parsed.<br>\nMake sure the dgml file is a valid xml file.`;
      let htmlContent = this.generateErrorMessageHtmlContent(webview, errorMessage);
      webview.html = htmlContent;
      return;
    }
    const outputJsFilename = DgmlViewer._name + '.js';
    let htmlContent = this.generateHtmlContent(webview, outputJsFilename);
    this.generateAndWriteJavascriptFile(() => {
      webview.html = htmlContent;
    });
  }

  private transferCallGraph2Dgml(callgraphJson:string):string {

    function getSimpleMethod(fullmethod:string):string {
      return fullmethod.substring(fullmethod.indexOf(':')+1, fullmethod.indexOf('('));
    }
    function buildDgml(node:any):void {  
      if (handledNodes.includes(node.method_full)) {
        return;
      }
      handledNodes.push(node.method_full);
      if (node.children != null) {
        for (let i = 0; i < node.children.length; i++) {  
          var dgmlNode = new dgml.Node(node.children[i].method_full, getSimpleMethod(node.children[i].method_full));
          graph.nodes.push(dgmlNode);
          graph.links.push(new dgml.Link(node.method_full, node.children[i].method_full));
          buildDgml(node.children[i]);        
        }
      }
    }

    let callgraph = JSON.parse(callgraphJson);
    let handledNodes:any = [];
    var graph = new dgml.DirectedGraph();
    var node1 = new dgml.Node(callgraph.method_full, getSimpleMethod(callgraph.method_full));
    node1.moreProps = { Background: 'Red' };
    graph.nodes.push(node1);
    buildDgml(callgraph);
    var ds = new dgml.nodeXml.Serializer(graph, {
      indent: true, declaration: true
    });
    return ds.toDgml();
  }

  private generateAndWriteJavascriptFile(callbackFunction: () => void) {
    if (this.directedGraph !== undefined && typeof this.directedGraph !== 'string' &&  this.directedGraph.nodes !== undefined) {
      const nodesJson = this.directedGraph.nodes
        .map(node => { return node.toJsString(); })
        .join(',\n');
      let edgesJson: string = '';
      if (this.directedGraph.edges !== undefined) {
        edgesJson = this.directedGraph.edges
          .map(edge => { return edge.toJsString(); })
          .filter(edge => edge !== '')
          .join(',\n');
      }
      const jsContent = this.generateJavascriptContent(nodesJson, edgesJson);
      const outputJsFilename = DgmlViewer._name + '.js';
      try {
        this.fsUtils.writeFile(this.extensionContext?.asAbsolutePath(path.join('.', outputJsFilename)), jsContent, callbackFunction);
      } catch (ex) {
        console.log('Dgml Viewer Exception:' + ex);
      }
    }
  }

  private generateJavascriptContent(nodesJson: string, edgesJson: string): string {
    const templateJsFilename = DgmlViewer._name + '_Template.js';
    let template = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', templateJsFilename)), 'utf8');
    let jsContent = template.replace('var nodeElements = [];', `var nodeElements = [${nodesJson}];`);
    jsContent = jsContent.replace('var edgeElements = [];', `var edgeElements = [${edgesJson}];`);
    jsContent = jsContent.replace('\'shape\': \'round-rectangle\',', `'shape': '${this.config.nodeShape}',`);
    jsContent = jsContent.replace('const edgeArrowType = \'triangle\' // edge arrow to type', `const edgeArrowType = '${this.config.edgeArrowToType}' // edge arrow to type}`);
    jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
    jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
    jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
    jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
    jsContent = jsContent.replace("const defaultLayout = ''; // The graph layout from the dgml file itself", `const defaultLayout = '${this.config.defaultLayout}'; // The graph layout from the dgml file itself`);
    jsContent = jsContent.replace('const defaultZoom = 1.25;', `const defaultZoom = ${this.zoom};`);
    return jsContent;
  }

  private generateHtmlContent(webview: vscode.Webview, outputJsFilename: string): string {
    const templateHtmlFilename = DgmlViewer._name + '_Template.html';
    let htmlContent = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', templateHtmlFilename)), 'utf8');

    const javascriptIncludes = ['cytoscape.min.js', 'cytoscape-svg.js'];
    javascriptIncludes.forEach((includeFile) => {
      const includePath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'javascript', includeFile);
      const includeUri = webview.asWebviewUri(includePath);
      htmlContent = htmlContent.replace(includeFile, includeUri.toString());
    });

    const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'stylesheets', DgmlViewer._name + '.css');
    const cssUri = webview.asWebviewUri(cssPath);
    htmlContent = htmlContent.replace(DgmlViewer._name + '.css', cssUri.toString());

    const nonce = this.getNonce();
    htmlContent = htmlContent.replace('nonce-nonce', `nonce-${nonce}`);
    htmlContent = htmlContent.replace(/<script /g, `<script nonce="${nonce}" `);
    htmlContent = htmlContent.replace('cspSource', webview.cspSource);

    const jsPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, outputJsFilename);
    const jsUri = webview.asWebviewUri(jsPath);
    htmlContent = htmlContent.replace(DgmlViewer._name + '.js', jsUri.toString());
    return htmlContent;
  }

  private generateErrorMessageHtmlContent(webview: vscode.Webview, errorMessage: string): string {
    const templateHtmlFilename = DgmlViewer._name + '_ErrorMessage_Template.html';
    let htmlContent = fs.readFileSync(this.extensionContext?.asAbsolutePath(path.join('templates', templateHtmlFilename)), 'utf8');
    htmlContent = htmlContent.replace("<!--ErrorMessage-->", errorMessage);

    const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'stylesheets', DgmlViewer._name + '.css');
    const cssUri = webview.asWebviewUri(cssPath);
    htmlContent = htmlContent.replace(DgmlViewer._name + '.css', cssUri.toString());

    return htmlContent;
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private saveAs(messageText: string, filename: string, asText: boolean = false) {
    const dataUrl = messageText.split(',');
    if (!asText && dataUrl.length === 0) {
      return;
    }
    var content;
    if (asText) {
      content = messageText;
    }
    else {
      content = Base64.toUint8Array(dataUrl[1]);
    }

    const workspaceDirectory = this.fsUtils.getWorkspaceFolder();
    const newFilePath = path.join(workspaceDirectory, filename);
    this.fsUtils.writeFile(newFilePath, content, () => { });

    vscode.window.showInformationMessage(`The file ${filename} has been created in the root of the workspace.`);
  }

}