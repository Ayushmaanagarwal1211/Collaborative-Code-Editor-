import React, { useEffect, useRef, useState } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";

function Editor({ socketRef, roomId, onCodeChange,lang }) {
  const editorRef = useRef(null);
  const text = useRef(null);

  useEffect(()=>{
    if(document && editorRef && editorRef.current){

      if(lang=="python3"){
        editorRef.current.setValue("print('Hello World')");
        editorRef.current.focus()

      }else if(lang=="nodejs"){
        editorRef.current.setValue("console.log('Hello World1')");
        editorRef.current.focus()

      }else{
        editorRef.current.setValue("");
        editorRef.current.focus()

      }
    }
    console.log(lang=="nodejs")
  },[lang,editorRef.current])
  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
      editorRef.current = editor;
      editorRef.current.focus()
      editor.setSize(null, "100%");
      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit("conde-change", {
            roomId,
            code,
          });
        }
      });
    };

    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("conde-change", ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }
    return () => {
      socketRef.current.off("conde-change");
    };
  }, [socketRef.current]);

  return (
    <div style={{ height: "600px" }}>
      <textarea id="realtimeEditor"  ></textarea>
    </div>
  );
}

export default Editor;
