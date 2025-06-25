package com.marcella.backend.nodeHandlers;

import com.marcella.backend.workflow.NodeExecutionMessage;

import java.util.Map;

public interface NodeHandler {
    boolean canHandle(String nodeType);
    Map<String, Object> execute(NodeExecutionMessage message) throws Exception;
}
